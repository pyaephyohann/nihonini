"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth/require-auth";
import {
  deleteTutorConversation,
  getTutorConversation,
  listTutorConversations,
} from "@/server/tutor/tutor-conversation.service";
import { sendTutorMessage } from "@/server/tutor/tutor.service";

export async function sendTutorMessageAction(payload: unknown) {
  const session = await requireAuth();
  const result = await sendTutorMessage({
    userId: session.user.id,
    payload,
  });

  if (!("error" in result)) {
    revalidatePath("/app/tutor");
    revalidatePath(`/app/tutor/${result.conversationId}`);
  }

  return result;
}

export async function listTutorConversationsAction() {
  const session = await requireAuth();
  return listTutorConversations(session.user.id);
}

export async function getTutorConversationAction(conversationId: string) {
  const session = await requireAuth();
  const conversation = await getTutorConversation(session.user.id, conversationId);
  if (!conversation) {
    return { error: "Conversation not found." as const };
  }
  return conversation;
}

export async function deleteTutorConversationAction(conversationId: string) {
  const session = await requireAuth();
  const result = await deleteTutorConversation(session.user.id, conversationId);

  if ("success" in result) {
    revalidatePath("/app/tutor");
    revalidatePath(`/app/tutor/${conversationId}`);
  }

  return result;
}
