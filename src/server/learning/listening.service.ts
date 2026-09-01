import "server-only";

import { cache } from "react";
import type { JapaneseLevel } from "@/generated/prisma/client";
import { submitListeningAnswersSchema } from "@/lib/validations/listening";
import {
  calculateListeningScorePercent,
  isListeningMastered,
  updateListeningMastery,
} from "@/server/learning/listening-mastery";
import {
  countPublishedListeningsByLevel,
  findListeningForGrading,
  findPublishedListeningBySlug,
  findPublishedListeningsForLevel,
  findRecentListeningSubmissions,
  findUserListeningProgressMap,
  findUserListeningProgressRows,
} from "@/server/learning/listening.repository";
import { prisma } from "@/server/db";
import type {
  ListeningCatalogLevel,
  ListeningDetail,
  ListeningListItem,
  ListeningSubmissionResult,
  ListeningSummary,
} from "@/types/learning";

const LEVEL_SEQUENCE: JapaneseLevel[] = ["N5", "N4", "N3", "N2", "N1"];

function difficultyLabel(difficulty: number): string {
  if (difficulty <= 1) return "Beginner";
  if (difficulty === 2) return "Elementary";
  return "Intermediate";
}

function mapListeningListItem(
  listening: {
    id: string;
    title: string;
    slug: string;
    subtitle: string | null;
    description: string | null;
    jlptLevel: JapaneseLevel;
    difficulty: number;
    estimatedMinutes: number;
    durationSeconds: number | null;
    order: number;
  },
  progress?: {
    attemptCount: number;
    completed: boolean;
    bestScore: number;
    lastScore: number;
    mastery: number;
  } | null,
): ListeningListItem {
  return {
    id: listening.id,
    title: listening.title,
    slug: listening.slug,
    subtitle: listening.subtitle,
    description: listening.description,
    jlptLevel: listening.jlptLevel,
    difficulty: listening.difficulty,
    difficultyLabel: difficultyLabel(listening.difficulty),
    estimatedMinutes: listening.estimatedMinutes,
    durationSeconds: listening.durationSeconds,
    order: listening.order,
    attemptCount: progress?.attemptCount ?? 0,
    completed: progress?.completed ?? false,
    bestScore: progress?.bestScore ?? 0,
    lastScore: progress?.lastScore ?? 0,
    masteryPercent: Math.round((progress?.mastery ?? 0) * 100),
  };
}

async function loadListeningCatalog(userId: string): Promise<ListeningCatalogLevel[]> {
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

  const levels: ListeningCatalogLevel[] = [];

  for (const level of path) {
    const listenings = await findPublishedListeningsForLevel(level);
    const progressMap = await findUserListeningProgressMap(
      userId,
      listenings.map((item) => item.id),
    );
    levels.push({
      level,
      listenings: listenings.map((item) =>
        mapListeningListItem(item, progressMap.get(item.id)),
      ),
    });
  }

  return levels;
}

export const getListeningCatalog = cache(loadListeningCatalog);

export async function getListeningBySlug(
  userId: string,
  slug: string,
): Promise<ListeningDetail | null> {
  const listening = await findPublishedListeningBySlug(slug);
  if (!listening) return null;

  const progressMap = await findUserListeningProgressMap(userId, [listening.id]);
  const progress = progressMap.get(listening.id);

  return {
    ...mapListeningListItem(listening, progress),
    audioUrl: listening.audioUrl,
    questions: listening.questions.map((question) => ({
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

export async function submitListeningAnswers(input: {
  userId: string;
  payload: unknown;
}): Promise<ListeningSubmissionResult | { error: string }> {
  const parsed = submitListeningAnswersSchema.safeParse(input.payload);
  if (!parsed.success) {
    return { error: "Invalid listening submission." };
  }

  const { listeningId, answers } = parsed.data;
  const listening = await findListeningForGrading(listeningId);
  if (!listening) {
    return { error: "Listening not found." };
  }

  const questionMap = new Map(
    listening.questions.map((question) => [question.id, question]),
  );

  if (answers.length !== listening.questions.length) {
    return { error: "Please answer all questions before submitting." };
  }

  const seenQuestions = new Set<string>();
  const gradedAnswers: ListeningSubmissionResult["answers"] = [];
  let correctCount = 0;

  for (const answer of answers) {
    if (seenQuestions.has(answer.questionId)) {
      return { error: "Duplicate question answers are not allowed." };
    }
    seenQuestions.add(answer.questionId);

    const question = questionMap.get(answer.questionId);
    if (!question) {
      return { error: "Invalid question for this listening." };
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

  const totalCount = listening.questions.length;
  const scorePercent = calculateListeningScorePercent(correctCount, totalCount);
  const now = new Date();

  const submission = await prisma.$transaction(async (tx) => {
    const createdSubmission = await tx.listeningSubmission.create({
      data: {
        userId: input.userId,
        listeningId: listening.id,
        correctCount,
        totalCount,
        scorePercent,
      },
    });

    for (const answer of gradedAnswers) {
      await tx.listeningQuestionAttempt.create({
        data: {
          submissionId: createdSubmission.id,
          questionId: answer.questionId,
          selectedOptionId: answer.selectedOptionId,
          isCorrect: answer.isCorrect,
        },
      });
    }

    const existing = await tx.userListeningProgress.findUnique({
      where: {
        userId_listeningId: {
          userId: input.userId,
          listeningId: listening.id,
        },
      },
    });

    const attemptCount = (existing?.attemptCount ?? 0) + 1;
    const mastery = updateListeningMastery(
      existing?.mastery ?? 0,
      scorePercent,
      attemptCount,
    );
    const completed = (existing?.completed ?? false) || scorePercent >= 80;
    const bestScore = Math.max(existing?.bestScore ?? 0, scorePercent);
    const lastScore = scorePercent;

    await tx.userListeningProgress.upsert({
      where: {
        userId_listeningId: {
          userId: input.userId,
          listeningId: listening.id,
        },
      },
      create: {
        userId: input.userId,
        listeningId: listening.id,
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
    listeningId: listening.id,
    listeningTitle: listening.title,
    listeningSlug: listening.slug,
    jlptLevel: listening.jlptLevel,
    correctCount,
    totalCount,
    incorrectCount: totalCount - correctCount,
    scorePercent,
    accuracy: scorePercent,
    masteryPercent: Math.round(submission.mastery * 100),
    completed: scorePercent >= 80,
    transcript: listening.transcript,
    answers: gradedAnswers.sort((a, b) => {
      const orderA = questionMap.get(a.questionId)?.order ?? 0;
      const orderB = questionMap.get(b.questionId)?.order ?? 0;
      return orderA - orderB;
    }),
  };
}

export async function getRecommendedListening(
  userId: string,
): Promise<ListeningSummary | null> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { japaneseLevel: true },
  });
  const level = profile?.japaneseLevel ?? "N5";
  const listenings = await findPublishedListeningsForLevel(level);
  if (listenings.length === 0) return null;

  const progressMap = await findUserListeningProgressMap(
    userId,
    listenings.map((item) => item.id),
  );

  const inProgress = listenings.find((item) => {
    const progress = progressMap.get(item.id);
    return progress && progress.attemptCount > 0 && !progress.completed;
  });
  if (inProgress) {
    return mapListeningListItem(inProgress, progressMap.get(inProgress.id));
  }

  const unread = listenings.find((item) => !progressMap.has(item.id));
  if (unread) {
    return mapListeningListItem(unread, null);
  }

  const weakest = [...listenings].sort((a, b) => {
    const masteryA = progressMap.get(a.id)?.mastery ?? 0;
    const masteryB = progressMap.get(b.id)?.mastery ?? 0;
    return masteryA - masteryB;
  })[0];

  return mapListeningListItem(weakest, progressMap.get(weakest.id));
}

export async function getListeningSkillMetrics(userId: string, level: JapaneseLevel) {
  const totalItems = await countPublishedListeningsByLevel(level);
  if (totalItems === 0) return null;

  const progressRows = await findUserListeningProgressRows(userId, level);
  const masterySum = progressRows.reduce((sum, row) => sum + row.mastery, 0);
  const masteryPercent = Math.round((masterySum / totalItems) * 100);
  const itemsStarted = progressRows.filter((row) => row.attemptCount > 0).length;
  const itemsMastered = progressRows.filter((row) => isListeningMastered(row.mastery)).length;
  const itemsInProgress = progressRows.filter(
    (row) => row.attemptCount > 0 && !isListeningMastered(row.mastery),
  ).length;

  const submissions = await prisma.listeningSubmission.findMany({
    where: { userId, listening: { jlptLevel: level, published: true } },
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

export async function getRecentListeningActivity(userId: string, limit = 5) {
  const submissions = await findRecentListeningSubmissions(userId, limit);
  return submissions.map((submission) => ({
    title: submission.listening.title,
    slug: submission.listening.slug,
    jlptLevel: submission.listening.jlptLevel,
    correctCount: submission.correctCount,
    totalCount: submission.totalCount,
    scorePercent: submission.scorePercent,
    occurredAt: submission.createdAt.toISOString(),
  }));
}
