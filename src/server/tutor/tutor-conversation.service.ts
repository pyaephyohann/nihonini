import "server-only";

import {
  prepareTutorResponseForClient,
  validateTutorResponsePayload,
} from "@/server/tutor/tutor-safety";
import type {
  TutorConversationDetail,
  TutorConversationSummary,
  TutorMessageDto,
} from "@/types/tutor";
import {
  deleteConversationForUser,
  findConversationForUser,
  listConversationsForUser,
  loadMessagesForConversation,
} from "@/server/tutor/tutor.repository";

function mapMessage(row: {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: Date;
  responseJson: unknown;
}): TutorMessageDto {
  const base = {
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
  };

  if (row.role !== "ASSISTANT" || row.responseJson === null) {
    return base;
  }

  const record = (row.responseJson || {}) as Record<string, unknown>;
  const {
    progressContext,
    outcomeContext,
    adaptiveCoachingContext,
    ...corePayload
  } = record;

  const parsed = validateTutorResponsePayload(corePayload);
  if (!parsed) {
    return base;
  }

  const restored = {
    ...parsed,
  } as Parameters<typeof prepareTutorResponseForClient>[0] & {
    progressContext?: unknown;
    outcomeContext?: unknown;
    adaptiveCoachingContext?: unknown;
  };

  if (progressContext) restored.progressContext = progressContext;
  if (outcomeContext) restored.outcomeContext = outcomeContext;
  if (adaptiveCoachingContext) restored.adaptiveCoachingContext = adaptiveCoachingContext;

  return {
    ...base,
    response: prepareTutorResponseForClient(restored as Parameters<typeof prepareTutorResponseForClient>[0]),
  };
}

export async function listTutorConversations(
  userId: string,
): Promise<TutorConversationSummary[]> {
  const rows = await listConversationsForUser(userId);
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    updatedAt: row.updatedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function getTutorConversation(
  userId: string,
  conversationId: string,
): Promise<TutorConversationDetail | null> {
  const loaded = await loadMessagesForConversation(conversationId, userId);
  if (!loaded) {
    return null;
  }

  return {
    id: loaded.conversation.id,
    title: loaded.conversation.title,
    updatedAt: loaded.conversation.updatedAt.toISOString(),
    createdAt: loaded.conversation.createdAt.toISOString(),
    messages: loaded.messages.map(mapMessage),
  };
}

export async function ensureTutorConversationAccess(
  conversationId: string,
  userId: string,
): Promise<{ error: string } | { conversationId: string }> {
  const conversation = await findConversationForUser(conversationId, userId);
  if (!conversation) {
    return { error: "Conversation not found." };
  }
  return { conversationId: conversation.id };
}

export async function deleteTutorConversation(
  userId: string,
  conversationId: string,
): Promise<{ success: true } | { error: string }> {
  const result = await deleteConversationForUser(conversationId, userId);
  if (result.count === 0) {
    return { error: "Conversation not found." };
  }
  return { success: true };
}

export function deriveConversationTitle(message: string): string {
  const normalized = message.replace(/\s+/g, " ").trim();
  if (normalized.length <= 48) {
    return normalized;
  }
  return `${normalized.slice(0, 45)}...`;
}
