import { z } from "zod";

export const checkExerciseAnswerSchema = z.object({
  exerciseId: z.string().min(1),
  selectedOptionId: z.string().min(1).optional(),
  textAnswer: z.string().trim().optional(),
});

export type CheckExerciseAnswerInput = z.infer<typeof checkExerciseAnswerSchema>;
