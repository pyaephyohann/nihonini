"use server";

import { requireAuth } from "@/server/auth/require-auth";
import { submitExercise } from "@/server/learning/practice.service";

export async function submitExerciseAnswerAction(input: {
  exerciseId: string;
  selectedOptionId?: string;
  textAnswer?: string;
  timeSpentMs?: number;
}) {
  const session = await requireAuth();
  return submitExercise({ userId: session.user.id, payload: input });
}
