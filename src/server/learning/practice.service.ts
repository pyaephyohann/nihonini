import "server-only";

import { submitExerciseAnswer } from "@/server/learning/exercise.service";

export async function submitExercise(input: { userId: string; payload: unknown }) {
  return submitExerciseAnswer(input);
}

