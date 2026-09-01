import "server-only";

import { prisma } from "@/server/db";

export async function findExerciseForSubmission(exerciseId: string) {
  return prisma.exercise.findFirst({
    where: {
      id: exerciseId,
      lesson: { published: true },
    },
    select: {
      id: true,
      lessonId: true,
      type: true,
      explanation: true,
      points: true,
      options: {
        select: {
          id: true,
          text: true,
          isCorrect: true,
        },
      },
      vocabularyTargets: {
        select: {
          vocabularyId: true,
        },
      },
      grammarTargets: {
        select: {
          grammarId: true,
        },
      },
      kanjiTargets: {
        select: {
          kanjiId: true,
        },
      },
      lesson: {
        select: {
          exercises: {
            select: { id: true },
          },
        },
      },
    },
  });
}

export async function countCorrectAttemptsForLesson(userId: string, lessonId: string) {
  return prisma.practiceAttempt.count({
    where: {
      userId,
      lessonId,
      isCorrect: true,
    },
  });
}

export async function countAttemptsForLesson(userId: string, lessonId: string) {
  return prisma.practiceAttempt.count({
    where: {
      userId,
      lessonId,
    },
  });
}

