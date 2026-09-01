import "server-only";

import { cache } from "react";
import type { JapaneseLevel } from "@/generated/prisma/client";
import { submitReadingAnswersSchema } from "@/lib/validations/reading";
import {
  calculateReadingScorePercent,
  isReadingMastered,
  updateReadingMastery,
} from "@/server/learning/reading-mastery";
import {
  countPublishedReadingsByLevel,
  findPublishedReadingBySlug,
  findPublishedReadingsForLevel,
  findReadingForGrading,
  findRecentReadingSubmissions,
  findUserReadingProgressMap,
  findUserReadingProgressRows,
} from "@/server/learning/reading.repository";
import { prisma } from "@/server/db";
import type {
  ReadingCatalogLevel,
  ReadingDetail,
  ReadingListItem,
  ReadingSubmissionResult,
  ReadingSummary,
} from "@/types/learning";

const LEVEL_SEQUENCE: JapaneseLevel[] = ["N5", "N4", "N3", "N2", "N1"];

function difficultyLabel(difficulty: number): string {
  if (difficulty <= 1) return "Beginner";
  if (difficulty === 2) return "Elementary";
  return "Intermediate";
}

function mapReadingListItem(
  reading: {
    id: string;
    title: string;
    slug: string;
    subtitle: string | null;
    description: string | null;
    jlptLevel: JapaneseLevel;
    difficulty: number;
    estimatedMinutes: number;
    order: number;
  },
  progress?: {
    attemptCount: number;
    completed: boolean;
    bestScore: number;
    lastScore: number;
    mastery: number;
  } | null,
): ReadingListItem {
  return {
    id: reading.id,
    title: reading.title,
    slug: reading.slug,
    subtitle: reading.subtitle,
    description: reading.description,
    jlptLevel: reading.jlptLevel,
    difficulty: reading.difficulty,
    difficultyLabel: difficultyLabel(reading.difficulty),
    estimatedMinutes: reading.estimatedMinutes,
    order: reading.order,
    attemptCount: progress?.attemptCount ?? 0,
    completed: progress?.completed ?? false,
    bestScore: progress?.bestScore ?? 0,
    lastScore: progress?.lastScore ?? 0,
    masteryPercent: Math.round((progress?.mastery ?? 0) * 100),
  };
}

async function loadReadingCatalog(userId: string): Promise<ReadingCatalogLevel[]> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { japaneseLevel: true, targetJlptLevel: true },
  });
  const currentLevel = profile?.japaneseLevel ?? "N5";
  const targetLevel = profile?.targetJlptLevel ?? currentLevel;
  const currentIndex = LEVEL_SEQUENCE.indexOf(currentLevel);
  const targetIndex = LEVEL_SEQUENCE.indexOf(targetLevel);
  const path =
    currentIndex === -1 || targetIndex === -1
      ? [currentLevel]
      : LEVEL_SEQUENCE.slice(
          Math.min(currentIndex, targetIndex),
          Math.max(currentIndex, targetIndex) + 1,
        );

  const levels: ReadingCatalogLevel[] = [];

  for (const level of path) {
    const readings = await findPublishedReadingsForLevel(level);
    const progressMap = await findUserReadingProgressMap(
      userId,
      readings.map((reading) => reading.id),
    );
    levels.push({
      level,
      readings: readings.map((reading) =>
        mapReadingListItem(reading, progressMap.get(reading.id)),
      ),
    });
  }

  return levels;
}

export const getReadingCatalog = cache(loadReadingCatalog);

export async function getReadingBySlug(
  userId: string,
  slug: string,
): Promise<ReadingDetail | null> {
  const reading = await findPublishedReadingBySlug(slug);
  if (!reading) return null;

  const progressMap = await findUserReadingProgressMap(userId, [reading.id]);
  const progress = progressMap.get(reading.id);

  return {
    ...mapReadingListItem(reading, progress),
    passage: reading.passage,
    questions: reading.questions.map((question) => ({
      id: question.id,
      question: question.question,
      order: question.order,
      options: question.options.map((option) => ({
        id: option.id,
        text: option.text,
        order: option.order,
      })),
    })),
  };
}

export async function submitReadingAnswers(input: {
  userId: string;
  payload: unknown;
}): Promise<ReadingSubmissionResult | { error: string }> {
  const parsed = submitReadingAnswersSchema.safeParse(input.payload);
  if (!parsed.success) {
    return { error: "Invalid reading submission." };
  }

  const { readingId, answers } = parsed.data;
  const reading = await findReadingForGrading(readingId);
  if (!reading) {
    return { error: "Reading not found." };
  }

  const questionMap = new Map(reading.questions.map((question) => [question.id, question]));

  if (answers.length !== reading.questions.length) {
    return { error: "Please answer all questions before submitting." };
  }

  const seenQuestions = new Set<string>();
  const gradedAnswers: ReadingSubmissionResult["answers"] = [];
  let correctCount = 0;

  for (const answer of answers) {
    if (seenQuestions.has(answer.questionId)) {
      return { error: "Duplicate question answers are not allowed." };
    }
    seenQuestions.add(answer.questionId);

    const question = questionMap.get(answer.questionId);
    if (!question) {
      return { error: "Invalid question for this reading." };
    }

    const selectedOption = question.options.find(
      (option) => option.id === answer.selectedOptionId,
    );
    if (!selectedOption) {
      return { error: "Invalid answer option." };
    }

    const correctOption = question.options.find((option) => option.isCorrect);
    const isCorrect = selectedOption.isCorrect;

    if (isCorrect) correctCount += 1;

    gradedAnswers.push({
      questionId: question.id,
      question: question.question,
      selectedOptionId: selectedOption.id,
      selectedOptionText: selectedOption.text,
      correctOptionId: correctOption?.id ?? "",
      correctOptionText: correctOption?.text ?? "",
      isCorrect,
      explanation: question.explanation,
    });
  }

  const totalCount = reading.questions.length;
  const scorePercent = calculateReadingScorePercent(correctCount, totalCount);
  const now = new Date();

  const submission = await prisma.$transaction(async (tx) => {
    const createdSubmission = await tx.readingSubmission.create({
      data: {
        userId: input.userId,
        readingId: reading.id,
        correctCount,
        totalCount,
        scorePercent,
      },
    });

    for (const answer of gradedAnswers) {
      await tx.readingQuestionAttempt.create({
        data: {
          submissionId: createdSubmission.id,
          questionId: answer.questionId,
          selectedOptionId: answer.selectedOptionId,
          isCorrect: answer.isCorrect,
        },
      });
    }

    const existing = await tx.userReadingProgress.findUnique({
      where: {
        userId_readingId: {
          userId: input.userId,
          readingId: reading.id,
        },
      },
    });

    const attemptCount = (existing?.attemptCount ?? 0) + 1;
    const mastery = updateReadingMastery(
      existing?.mastery ?? 0,
      scorePercent,
      attemptCount,
    );
    const completed = (existing?.completed ?? false) || scorePercent >= 80;
    const bestScore = Math.max(existing?.bestScore ?? 0, scorePercent);
    const lastScore = scorePercent;

    await tx.userReadingProgress.upsert({
      where: {
        userId_readingId: {
          userId: input.userId,
          readingId: reading.id,
        },
      },
      create: {
        userId: input.userId,
        readingId: reading.id,
        attemptCount,
        completed,
        bestScore,
        lastScore,
        mastery,
        lastAttemptAt: now,
        completedAt: completed ? now : null,
      },
      update: {
        attemptCount,
        completed,
        bestScore,
        lastScore,
        mastery,
        lastAttemptAt: now,
        completedAt: completed ? (existing?.completedAt ?? now) : existing?.completedAt,
      },
    });

    return { submissionId: createdSubmission.id, mastery };
  });

  return {
    submissionId: submission.submissionId,
    readingId: reading.id,
    readingTitle: reading.title,
    readingSlug: reading.slug,
    jlptLevel: reading.jlptLevel,
    correctCount,
    totalCount,
    incorrectCount: totalCount - correctCount,
    scorePercent,
    accuracy: scorePercent,
    masteryPercent: Math.round(submission.mastery * 100),
    completed: scorePercent >= 80,
    answers: gradedAnswers.sort((a, b) => {
      const orderA = questionMap.get(a.questionId)?.order ?? 0;
      const orderB = questionMap.get(b.questionId)?.order ?? 0;
      return orderA - orderB;
    }),
  };
}

export async function getRecommendedReading(
  userId: string,
): Promise<ReadingSummary | null> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { japaneseLevel: true },
  });
  const level = profile?.japaneseLevel ?? "N5";
  const readings = await findPublishedReadingsForLevel(level);
  if (readings.length === 0) return null;

  const progressMap = await findUserReadingProgressMap(
    userId,
    readings.map((reading) => reading.id),
  );

  const inProgress = readings.find((reading) => {
    const progress = progressMap.get(reading.id);
    return progress && progress.attemptCount > 0 && !progress.completed;
  });
  if (inProgress) {
    return mapReadingListItem(inProgress, progressMap.get(inProgress.id));
  }

  const unread = readings.find((reading) => !progressMap.has(reading.id));
  if (unread) {
    return mapReadingListItem(unread, null);
  }

  const weakest = [...readings].sort((a, b) => {
    const masteryA = progressMap.get(a.id)?.mastery ?? 0;
    const masteryB = progressMap.get(b.id)?.mastery ?? 0;
    return masteryA - masteryB;
  })[0];

  return mapReadingListItem(weakest, progressMap.get(weakest.id));
}

export async function getReadingSkillMetrics(userId: string, level: JapaneseLevel) {
  const totalItems = await countPublishedReadingsByLevel(level);
  const progressRows = await findUserReadingProgressRows(userId, level);

  if (totalItems === 0) {
    return null;
  }

  const masterySum = progressRows.reduce((sum, row) => sum + row.mastery, 0);
  const masteryPercent = Math.round((masterySum / totalItems) * 100);
  const itemsStarted = progressRows.filter((row) => row.attemptCount > 0).length;
  const itemsMastered = progressRows.filter((row) => isReadingMastered(row.mastery)).length;
  const itemsInProgress = progressRows.filter(
    (row) => row.attemptCount > 0 && !isReadingMastered(row.mastery),
  ).length;

  const submissions = await prisma.readingSubmission.findMany({
    where: { userId, reading: { jlptLevel: level, published: true } },
    select: { correctCount: true, totalCount: true },
  });

  const totalQuestions = submissions.reduce((sum, row) => sum + row.totalCount, 0);
  const correctAnswers = submissions.reduce((sum, row) => sum + row.correctCount, 0);
  const accuracy =
    totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : null;

  return {
    masteryPercent,
    totalItems,
    itemsStarted,
    itemsMastered,
    itemsInProgress,
    accuracy,
    hasData: itemsStarted > 0 || totalItems > 0,
  };
}

export async function getRecentReadingActivity(userId: string, limit = 5) {
  const submissions = await findRecentReadingSubmissions(userId, limit);
  return submissions.map((submission) => ({
    title: submission.reading.title,
    slug: submission.reading.slug,
    jlptLevel: submission.reading.jlptLevel,
    correctCount: submission.correctCount,
    totalCount: submission.totalCount,
    scorePercent: submission.scorePercent,
    occurredAt: submission.createdAt.toISOString(),
  }));
}
