import "server-only";

import { prisma } from "@/server/db";

export async function findPublishedExerciseById(exerciseId: string) {
  return prisma.exercise.findFirst({
    where: {
      id: exerciseId,
      lesson: { published: true },
    },
    select: {
      id: true,
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
    },
  });
}
