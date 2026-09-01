import { z } from "zod";

export const submitListeningAnswersSchema = z.object({
  listeningId: z.string().min(1),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        selectedOptionId: z.string().min(1),
      }),
    )
    .min(1),
});

export type SubmitListeningAnswersInput = z.infer<typeof submitListeningAnswersSchema>;
