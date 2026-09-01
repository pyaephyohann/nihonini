import "server-only";

import type { LessonProgressStatus, Prisma } from "@/generated/prisma/client";
import type { ExerciseCheckResult } from "@/types/learning";
import { LESSON_COMPLETION_THRESHOLD, calculateLessonProgressPercent, calculateMastery } from "@/server/learning/mastery";
import { calculateNextReviewAt } from "@/server/learning/scheduler";
import { submitExerciseAnswerSchema } from "@/lib/validations/exercise";
import { prisma } from "@/server/db";
import { findExerciseForSubmission } from "@/server/learning/practice.repository";

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function getCorrectAnswer(exercise: {
  options: { id: string; text: string; isCorrect: boolean }[];
}): string {
  const correct = exercise.options.find((option) => option.isCorrect);
  return correct?.text ?? "";
}

type ProgressKind = "vocabulary" | "grammar" | "kanji";

function buildAnswerPayload(input: {
  selectedOptionId?: string;
  textAnswer?: string;
}): Prisma.JsonObject {
  return {
    selectedOptionId: input.selectedOptionId ?? null,
    textAnswer: input.textAnswer ?? null,
  };
}

function getLessonStatus(progressPercent: number): LessonProgressStatus {
  return progressPercent >= LESSON_COMPLETION_THRESHOLD ? "COMPLETED" : "IN_PROGRESS";
}

async function upsertTargetProgress(input: {
  tx: Prisma.TransactionClient;
  kind: ProgressKind;
  userId: string;
  targetId: string;
  correct: boolean;
  now: Date;
}) {
  const { tx, kind, userId, targetId, correct, now } = input;

  if (kind === "vocabulary") {
    const existing = await tx.userVocabularyProgress.findUnique({
      where: { userId_vocabularyId: { userId, vocabularyId: targetId } },
    });
    const correctCount = (existing?.correctCount ?? 0) + (correct ? 1 : 0);
    const incorrectCount = (existing?.incorrectCount ?? 0) + (correct ? 0 : 1);
    const attemptCount = (existing?.attemptCount ?? 0) + 1;
    const mastery = calculateMastery({
      previousMastery: existing?.mastery ?? 0,
      correct,
      attemptCount,
    });
    const nextReviewAt = calculateNextReviewAt({ correct, correctCount, mastery, now });
    const row = await tx.userVocabularyProgress.upsert({
      where: { userId_vocabularyId: { userId, vocabularyId: targetId } },
      create: {
        userId,
        vocabularyId: targetId,
        correctCount,
        incorrectCount,
        attemptCount,
        mastery,
        lastReviewedAt: now,
        nextReviewAt,
      },
      update: {
        correctCount,
        incorrectCount,
        attemptCount,
        mastery,
        lastReviewedAt: now,
        nextReviewAt,
      },
    });
    return { mastery: row.mastery, nextReviewAt: row.nextReviewAt };
  }

  if (kind === "grammar") {
    const existing = await tx.userGrammarProgress.findUnique({
      where: { userId_grammarId: { userId, grammarId: targetId } },
    });
    const correctCount = (existing?.correctCount ?? 0) + (correct ? 1 : 0);
    const incorrectCount = (existing?.incorrectCount ?? 0) + (correct ? 0 : 1);
    const attemptCount = (existing?.attemptCount ?? 0) + 1;
    const mastery = calculateMastery({
      previousMastery: existing?.mastery ?? 0,
      correct,
      attemptCount,
    });
    const nextReviewAt = calculateNextReviewAt({ correct, correctCount, mastery, now });
    const row = await tx.userGrammarProgress.upsert({
      where: { userId_grammarId: { userId, grammarId: targetId } },
      create: {
        userId,
        grammarId: targetId,
        correctCount,
        incorrectCount,
        attemptCount,
        mastery,
        lastReviewedAt: now,
        nextReviewAt,
      },
      update: {
        correctCount,
        incorrectCount,
        attemptCount,
        mastery,
        lastReviewedAt: now,
        nextReviewAt,
      },
    });
    return { mastery: row.mastery, nextReviewAt: row.nextReviewAt };
  }

  const existing = await tx.userKanjiProgress.findUnique({
    where: { userId_kanjiId: { userId, kanjiId: targetId } },
  });
  const correctCount = (existing?.correctCount ?? 0) + (correct ? 1 : 0);
  const incorrectCount = (existing?.incorrectCount ?? 0) + (correct ? 0 : 1);
  const attemptCount = (existing?.attemptCount ?? 0) + 1;
  const mastery = calculateMastery({
    previousMastery: existing?.mastery ?? 0,
    correct,
    attemptCount,
  });
  const nextReviewAt = calculateNextReviewAt({ correct, correctCount, mastery, now });
  const row = await tx.userKanjiProgress.upsert({
    where: { userId_kanjiId: { userId, kanjiId: targetId } },
    create: {
      userId,
      kanjiId: targetId,
      correctCount,
      incorrectCount,
      attemptCount,
      mastery,
      lastReviewedAt: now,
      nextReviewAt,
    },
    update: {
      correctCount,
      incorrectCount,
      attemptCount,
      mastery,
      lastReviewedAt: now,
      nextReviewAt,
    },
  });
  return { mastery: row.mastery, nextReviewAt: row.nextReviewAt };
}

export async function submitExerciseAnswer(input: {
  userId: string;
  payload: unknown;
}): Promise<ExerciseCheckResult | { error: string }> {
  const parsed = submitExerciseAnswerSchema.safeParse(input.payload);
  if (!parsed.success) {
    return { error: "Invalid answer submission." };
  }

  const { exerciseId, selectedOptionId, textAnswer, timeSpentMs } = parsed.data;
  const now = new Date();
  const exercise = await findExerciseForSubmission(exerciseId);

  if (!exercise) {
    return { error: "Exercise not found." };
  }

  let correct = false;

  switch (exercise.type) {
    case "MULTIPLE_CHOICE":
    case "MATCHING":
    case "ORDERING": {
      if (!selectedOptionId) {
        return { error: "Please select an answer." };
      }
      const selected = exercise.options.find(
        (option) => option.id === selectedOptionId,
      );
      correct = selected?.isCorrect ?? false;
      break;
    }
    case "FILL_BLANK":
    case "TRANSLATION": {
      if (!textAnswer) {
        return { error: "Please enter an answer." };
      }
      const expected = exercise.options.find((option) => option.isCorrect);
      correct =
        expected !== undefined &&
        normalizeText(textAnswer) === normalizeText(expected.text);
      break;
    }
    default:
      return { error: "Unsupported exercise type." };
  }

  const submission = await prisma.$transaction(async (tx) => {
    await tx.practiceAttempt.create({
      data: {
        userId: input.userId,
        lessonId: exercise.lessonId,
        exerciseId: exercise.id,
        isCorrect: correct,
        answer: buildAnswerPayload({ selectedOptionId, textAnswer }),
        timeSpentMs,
      },
    });

    const masterySummary = {
      vocabulary: null as number | null,
      grammar: null as number | null,
      kanji: null as number | null,
    };
    const nextReviewDates: Date[] = [];

    for (const target of exercise.vocabularyTargets) {
      const updated = await upsertTargetProgress({
        tx,
        kind: "vocabulary",
        userId: input.userId,
        targetId: target.vocabularyId,
        correct,
        now,
      });
      masterySummary.vocabulary = updated.mastery;
      if (updated.nextReviewAt) nextReviewDates.push(updated.nextReviewAt);
    }

    for (const target of exercise.grammarTargets) {
      const updated = await upsertTargetProgress({
        tx,
        kind: "grammar",
        userId: input.userId,
        targetId: target.grammarId,
        correct,
        now,
      });
      masterySummary.grammar = updated.mastery;
      if (updated.nextReviewAt) nextReviewDates.push(updated.nextReviewAt);
    }

    for (const target of exercise.kanjiTargets) {
      const updated = await upsertTargetProgress({
        tx,
        kind: "kanji",
        userId: input.userId,
        targetId: target.kanjiId,
        correct,
        now,
      });
      masterySummary.kanji = updated.mastery;
      if (updated.nextReviewAt) nextReviewDates.push(updated.nextReviewAt);
    }

    const totalExercises = exercise.lesson.exercises.length;
    const correctByExercise = await tx.practiceAttempt.groupBy({
      by: ["exerciseId"],
      where: {
        userId: input.userId,
        lessonId: exercise.lessonId,
        isCorrect: true,
      },
    });
    const lessonProgressPercent = calculateLessonProgressPercent(
      correctByExercise.length,
      totalExercises,
    );
    const lessonStatus = getLessonStatus(lessonProgressPercent);

    await tx.userLessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: input.userId,
          lessonId: exercise.lessonId,
        },
      },
      create: {
        userId: input.userId,
        lessonId: exercise.lessonId,
        status: lessonStatus,
        progress: lessonProgressPercent,
        score: lessonProgressPercent,
        startedAt: now,
        completedAt: lessonStatus === "COMPLETED" ? now : null,
      },
      update: {
        status: lessonStatus,
        progress: lessonProgressPercent,
        score: lessonProgressPercent,
        completedAt: lessonStatus === "COMPLETED" ? now : null,
      },
    });

    return {
      lessonProgressPercent,
      lessonStatus,
      nextReviewAt:
        nextReviewDates.length > 0
          ? nextReviewDates.sort((a, b) => a.getTime() - b.getTime())[0]
          : null,
      masterySummary,
    };
  });

  const correctAnswer = getCorrectAnswer(exercise);
  return {
    correct,
    correctAnswer,
    explanation: exercise.explanation,
    points: correct ? exercise.points : 0,
    lessonProgress: submission.lessonProgressPercent,
    lessonStatus: submission.lessonStatus,
    itemMastery: submission.masterySummary,
    nextReviewAt: submission.nextReviewAt?.toISOString() ?? null,
  };
}
