import { z } from "zod";
import { japaneseLevelValues, learningGoalValues } from "@/lib/validations/auth";

export const updateLearningPreferencesSchema = z.object({
  japaneseLevel: z.enum(japaneseLevelValues, {
    error: "Please select a valid current level.",
  }),
  targetJlptLevel: z.enum(japaneseLevelValues, {
    error: "Please select a valid target JLPT level.",
  }),
  learningGoal: z.enum(learningGoalValues, {
    error: "Please select a valid learning goal.",
  }),
  dailyGoal: z.number().int().min(1).max(50),
});

export type UpdateLearningPreferencesInput = z.infer<
  typeof updateLearningPreferencesSchema
>;

