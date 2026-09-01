import "server-only";

import type { ExerciseType } from "@/generated/prisma/client";
import type { ExerciseCheckResult } from "@/types/learning";
import { checkExerciseAnswerSchema } from "@/lib/validations/exercise";
import { findPublishedExerciseById } from "@/server/learning/exercise.repository";

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

async function getCorrectAnswer(exercise: {
  type: ExerciseType;
  options: { id: string; text: string; isCorrect: boolean }[];
}): Promise<string> {
  if (
    exercise.type === "MULTIPLE_CHOICE" ||
    exercise.type === "MATCHING" ||
    exercise.type === "ORDERING"
  ) {
    const correct = exercise.options.find((option) => option.isCorrect);
    return correct?.text ?? "";
  }

  const correct = exercise.options.find((option) => option.isCorrect);
  return correct?.text ?? "";
}

export async function checkExerciseAnswer(
  input: unknown,
): Promise<ExerciseCheckResult | { error: string }> {
  const parsed = checkExerciseAnswerSchema.safeParse(input);

  if (!parsed.success) {
    return { error: "Invalid answer submission." };
  }

  const { exerciseId, selectedOptionId, textAnswer } = parsed.data;

  const exercise = await findPublishedExerciseById(exerciseId);

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

  const correctAnswer = await getCorrectAnswer(exercise);

  return {
    correct,
    correctAnswer,
    explanation: exercise.explanation,
    points: correct ? exercise.points : 0,
  };
}
