import "server-only";

import type { JapaneseLevel } from "@/generated/prisma/client";
import { prisma } from "@/server/db";

export async function findPublishedListeningsForLevel(level: JapaneseLevel) {
  return prisma.listening.findMany({
    where: { jlptLevel: level, published: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      subtitle: true,
      description: true,
      jlptLevel: true,
      difficulty: true,
      estimatedMinutes: true,
      durationSeconds: true,
      order: true,
    },
  });
}

export async function findPublishedListeningBySlug(slug: string) {
  return prisma.listening.findFirst({
    where: { slug, published: true },
    select: {
      id: true,
      title: true,
      slug: true,
      subtitle: true,
      description: true,
      audioUrl: true,
      durationSeconds: true,
      jlptLevel: true,
      difficulty: true,
      estimatedMinutes: true,
      order: true,
      questions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          question: true,
          order: true,
          options: {
            orderBy: { order: "asc" },
            select: { id: true, text: true, order: true },
          },
        },
      },
    },
  });
}

export async function findListeningForGrading(listeningId: string) {
  return prisma.listening.findFirst({
    where: { id: listeningId, published: true },
    select: {
      id: true,
      title: true,
      slug: true,
      jlptLevel: true,
      transcript: true,
      questions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          question: true,
          explanation: true,
          order: true,
          options: {
            orderBy: { order: "asc" },
            select: { id: true, text: true, isCorrect: true, order: true },
          },
        },
      },
    },
  });
}

export async function findUserListeningProgressMap(
  userId: string,
  listeningIds: string[],
) {
  if (listeningIds.length === 0) return new Map();

  const rows = await prisma.userListeningProgress.findMany({
    where: { userId, listeningId: { in: listeningIds } },
    select: {
      listeningId: true,
      attemptCount: true,
      completed: true,
      bestScore: true,
      lastScore: true,
      mastery: true,
      lastAttemptAt: true,
    },
  });

  return new Map(rows.map((row) => [row.listeningId, row]));
}

export async function countPublishedListeningsByLevel(level: JapaneseLevel) {
  return prisma.listening.count({
    where: { jlptLevel: level, published: true },
  });
}

export async function findUserListeningProgressRows(
  userId: string,
  level: JapaneseLevel,
) {
  return prisma.userListeningProgress.findMany({
    where: { userId, listening: { jlptLevel: level, published: true } },
    select: {
      mastery: true,
      attemptCount: true,
      completed: true,
      bestScore: true,
      lastScore: true,
    },
  });
}

export async function findRecentListeningSubmissions(userId: string, limit: number) {
  return prisma.listeningSubmission.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      correctCount: true,
      totalCount: true,
      scorePercent: true,
      createdAt: true,
      listening: {
        select: { title: true, slug: true, jlptLevel: true },
      },
    },
  });
}
