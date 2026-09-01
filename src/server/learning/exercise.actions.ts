"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth/require-auth";
import { submitExercise } from "@/server/learning/practice.service";

export async function submitExerciseAnswerAction(input: {
  exerciseId: string;
  selectedOptionId?: string;
  textAnswer?: string;
  timeSpentMs?: number;
}) {
  const session = await requireAuth();
  const result = await submitExercise({ userId: session.user.id, payload: input });

  if (!("error" in result)) {
    revalidatePath("/app");
    revalidatePath("/app/progress");
    revalidatePath("/app/learn");
  }

  return result;
}
