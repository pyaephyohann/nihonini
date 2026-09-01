"use server";

import { checkExerciseAnswer } from "@/server/learning/exercise.service";

export async function checkExerciseAnswerAction(input: {
  exerciseId: string;
  selectedOptionId?: string;
  textAnswer?: string;
}) {
  return checkExerciseAnswer(input);
}
