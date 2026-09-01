import { z } from "zod";

export const submitReadingAnswersSchema = z.object({
  readingId: z.string().min(1),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        selectedOptionId: z.string().min(1),
      }),
    )
    .min(1),
});

export type SubmitReadingAnswersInput = z.infer<typeof submitReadingAnswersSchema>;
