import { z } from "zod";

export const submitExerciseAnswerSchema = z
  .object({
    exerciseId: z.string().min(1),
    selectedOptionId: z.string().min(1).optional(),
    textAnswer: z.string().trim().min(1).optional(),
    timeSpentMs: z.number().int().min(0).max(15 * 60 * 1000).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.selectedOptionId && !data.textAnswer) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["selectedOptionId"],
        message: "An answer is required.",
      });
    }
  });

export type SubmitExerciseAnswerInput = z.infer<typeof submitExerciseAnswerSchema>;
