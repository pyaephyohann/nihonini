import { z } from "zod";

export const updateDailyGoalSchema = z.object({
  dailyGoal: z.number().int().min(1).max(50),
});

export type UpdateDailyGoalInput = z.infer<typeof updateDailyGoalSchema>;

