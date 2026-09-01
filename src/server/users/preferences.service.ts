import "server-only";

import { updateLearningPreferencesSchema } from "@/lib/validations/profile";
import { updateLearningPreferencesByUserId } from "@/server/users/user.repository";

export type UpdateLearningPreferencesResult =
  | { success: true }
  | { success: false; error: string };

export async function updateLearningPreferences(
  userId: string,
  input: unknown,
): Promise<UpdateLearningPreferencesResult> {
  const parsed = updateLearningPreferencesSchema.safeParse(input);

  if (!parsed.success) {
    const firstError =
      parsed.error.issues[0]?.message ?? "Invalid learning preferences.";
    return { success: false, error: firstError };
  }

  try {
    await updateLearningPreferencesByUserId({
      userId,
      ...parsed.data,
    });
  } catch {
    return { success: false, error: "Unable to update learning preferences." };
  }

  return { success: true };
}

