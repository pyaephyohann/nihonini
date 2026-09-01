"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth/require-auth";
import { updateDailyGoal } from "@/server/learning/daily-learning.service";

export async function updateDailyGoalAction(formData: FormData) {
  const session = await requireAuth();
  const dailyGoalValue = Number(formData.get("dailyGoal"));
  const result = await updateDailyGoal({
    userId: session.user.id,
    dailyGoal: Number.isFinite(dailyGoalValue) ? dailyGoalValue : 0,
  });

  if ("error" in result) {
    return;
  }

  revalidatePath("/app");
}

