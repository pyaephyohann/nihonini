"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth/require-auth";
import { submitListeningAnswers } from "@/server/learning/listening.service";

export async function submitListeningAnswersAction(payload: unknown) {
  const session = await requireAuth();
  const result = await submitListeningAnswers({
    userId: session.user.id,
    payload,
  });

  if (!("error" in result)) {
    revalidatePath("/app");
    revalidatePath("/app/progress");
    revalidatePath("/app/learn");
    revalidatePath("/app/learn/listening");
    revalidatePath(`/app/learn/listening/${result.listeningSlug}`);
  }

  return result;
}
