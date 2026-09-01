"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth/require-auth";
import { submitReadingAnswers } from "@/server/learning/reading.service";

export async function submitReadingAnswersAction(payload: unknown) {
  const session = await requireAuth();
  const result = await submitReadingAnswers({
    userId: session.user.id,
    payload,
  });

  if (!("error" in result)) {
    revalidatePath("/app");
    revalidatePath("/app/progress");
    revalidatePath("/app/learn");
    revalidatePath("/app/learn/reading");
    revalidatePath(`/app/learn/reading/${result.readingSlug}`);
  }

  return result;
}
