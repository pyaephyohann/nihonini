import { z } from "zod";
import { japaneseLevelValues } from "@/lib/validations/auth";

export const practiceSkillValues = ["VOCABULARY", "GRAMMAR", "KANJI"] as const;
export const practiceModeValues = ["REVIEW", "WEAKNESS", "LEVEL"] as const;
export const practiceQuestionCountValues = [5, 10, 20] as const;

export const practiceConfigSchema = z.object({
  level: z.enum(japaneseLevelValues, {
    error: "Please select a valid JLPT level.",
  }),
  skill: z.enum(practiceSkillValues, {
    error: "Please select a valid practice skill.",
  }),
  mode: z.enum(practiceModeValues, {
    error: "Please select a valid practice mode.",
  }),
  questionCount: z
    .number()
    .int()
    .refine((value) => practiceQuestionCountValues.includes(value as 5 | 10 | 20), {
      message: "Please select a supported question count.",
    }),
});

export type PracticeConfigInput = z.infer<typeof practiceConfigSchema>;

export const practiceSessionSearchParamsSchema = z.object({
  level: z.enum(japaneseLevelValues),
  skill: z.enum(practiceSkillValues),
  mode: z.enum(practiceModeValues),
  count: z.enum(["5", "10", "20"]),
});

