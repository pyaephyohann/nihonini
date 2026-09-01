"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth/require-auth";
import { updateLearningPreferences } from "@/server/users/preferences.service";

export type LearningPreferencesActionState = {
  error?: string;
  success?: boolean;
};

export async function updateLearningPreferencesAction(
  _prevState: LearningPreferencesActionState,
  formData: FormData,
): Promise<LearningPreferencesActionState> {
  const session = await requireAuth();

  const result = await updateLearningPreferences(session.user.id, {
    japaneseLevel: String(formData.get("japaneseLevel") ?? ""),
    targetJlptLevel: String(formData.get("targetJlptLevel") ?? ""),
    learningGoal: String(formData.get("learningGoal") ?? ""),
    dailyGoal: Number(formData.get("dailyGoal") ?? 0),
  });

  if (!result.success) {
    return { error: result.error };
  }

  revalidatePath("/app");
  revalidatePath("/app/learn");
  return { success: true };
}

