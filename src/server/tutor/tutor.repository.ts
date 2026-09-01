import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db";
import { MAX_HISTORY_MESSAGES } from "@/server/tutor/tutor.constants";

export async function createConversation(userId: string, title: string) {
  return prisma.tutorConversation.create({
    data: { userId, title },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function findConversationForUser(conversationId: string, userId: string) {
  return prisma.tutorConversation.findFirst({
    where: { id: conversationId, userId },
    select: {
      id: true,
      title: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function listConversationsForUser(userId: string) {
  return prisma.tutorConversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      createdAt: true,
    },
  });
}

export async function createUserMessage(conversationId: string, content: string) {
  return prisma.tutorMessage.create({
    data: {
      conversationId,
      role: "USER",
      content,
    },
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
      responseJson: true,
    },
  });
}

export async function createAssistantMessage(
  conversationId: string,
  content: string,
  responseJson: Prisma.InputJsonValue,
) {
  return prisma.tutorMessage.create({
    data: {
      conversationId,
      role: "ASSISTANT",
      content,
      responseJson,
    },
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
      responseJson: true,
    },
  });
}

export async function touchConversation(conversationId: string, userId: string) {
  return prisma.tutorConversation.updateMany({
    where: { id: conversationId, userId },
    data: { updatedAt: new Date() },
  });
}

export async function deleteConversationForUser(conversationId: string, userId: string) {
  return prisma.tutorConversation.deleteMany({
    where: { id: conversationId, userId },
  });
}

export async function loadRecentMessagesForPrompt(
  conversationId: string,
  userId: string,
  excludeMessageId: string,
) {
  const conversation = await findConversationForUser(conversationId, userId);
  if (!conversation) {
    return null;
  }

  const messages = await prisma.tutorMessage.findMany({
    where: {
      conversationId,
      id: { not: excludeMessageId },
    },
    orderBy: { createdAt: "desc" },
    take: MAX_HISTORY_MESSAGES,
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
    },
  });

  return messages.reverse();
}

export async function loadMessagesForConversation(
  conversationId: string,
  userId: string,
) {
  const conversation = await findConversationForUser(conversationId, userId);
  if (!conversation) {
    return null;
  }

  const messages = await prisma.tutorMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: MAX_HISTORY_MESSAGES,
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
      responseJson: true,
    },
  });

  return {
    conversation,
    messages: messages.reverse(),
  };
}

export async function countUserMessagesSince(userId: string, since: Date) {
  return prisma.tutorMessage.count({
    where: {
      role: "USER",
      createdAt: { gte: since },
      conversation: { userId },
    },
  });
}

export async function findRecentDuplicateUserMessage(
  conversationId: string,
  content: string,
  since: Date,
) {
  return prisma.tutorMessage.findFirst({
    where: {
      conversationId,
      role: "USER",
      content,
      createdAt: { gte: since },
    },
    select: { id: true },
  });
}
