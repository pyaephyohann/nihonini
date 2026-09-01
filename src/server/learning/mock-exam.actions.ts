"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth/require-auth";
import {
  saveMockExamAnswer,
  startMockExamSession,
  submitMockExamSession,
} from "@/server/learning/mock-exam.service";

export async function startMockExamSessionAction(payload: unknown) {
  const session = await requireAuth();
  const result = await startMockExamSession({
    userId: session.user.id,
    payload,
  });

  if (!("error" in result)) {
    revalidatePath("/app/exams");
    revalidatePath(`/app/exams/session/${result.sessionId}`);
  }

  return result;
}

export async function saveMockExamAnswerAction(payload: unknown) {
  const session = await requireAuth();
  return saveMockExamAnswer({
    userId: session.user.id,
    payload,
  });
}

export async function submitMockExamSessionAction(payload: unknown) {
  const session = await requireAuth();
  const result = await submitMockExamSession({
    userId: session.user.id,
    payload,
  });

  if (!("error" in result)) {
    revalidatePath("/app");
    revalidatePath("/app/progress");
    revalidatePath("/app/exams");
    revalidatePath(`/app/exams/session/${result.sessionId}`);
    revalidatePath(`/app/exams/result/${result.sessionId}`);
  }

  return result;
}
