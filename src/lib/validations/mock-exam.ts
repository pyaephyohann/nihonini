import { z } from "zod";

export const saveMockExamAnswerSchema = z.object({
  sessionId: z.string().min(1),
  questionId: z.string().min(1),
  selectedOptionId: z.string().min(1),
});

export const submitMockExamSessionSchema = z.object({
  sessionId: z.string().min(1),
});

export const startMockExamSessionSchema = z.object({
  mockExamId: z.string().min(1),
});

export type SaveMockExamAnswerInput = z.infer<typeof saveMockExamAnswerSchema>;
export type SubmitMockExamSessionInput = z.infer<typeof submitMockExamSessionSchema>;
export type StartMockExamSessionInput = z.infer<typeof startMockExamSessionSchema>;
