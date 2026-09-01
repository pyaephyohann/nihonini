import "server-only";

import type { JapaneseLevel } from "@/generated/prisma/client";
import { prisma } from "@/server/db";

export async function findPublishedReadingsForLevel(level: JapaneseLevel) {
  return prisma.reading.findMany({
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
      order: true,
    },
  });
}

export async function findPublishedReadingBySlug(slug: string) {
  return prisma.reading.findFirst({
    where: { slug, published: true },
    select: {
      id: true,
      title: true,
      slug: true,
      subtitle: true,
      description: true,
      passage: true,
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
            select: {
              id: true,
              text: true,
              order: true,
            },
          },
        },
      },
    },
  });
}

export async function findReadingForGrading(readingId: string) {
  return prisma.reading.findFirst({
    where: { id: readingId, published: true },
    select: {
      id: true,
      title: true,
      slug: true,
      jlptLevel: true,
      questions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          question: true,
          explanation: true,
          order: true,
          options: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              text: true,
              isCorrect: true,
              order: true,
            },
          },
        },
      },
    },
  });
}

export async function findUserReadingProgressMap(userId: string, readingIds: string[]) {
  if (readingIds.length === 0) return new Map();

  const rows = await prisma.userReadingProgress.findMany({
    where: { userId, readingId: { in: readingIds } },
    select: {
      readingId: true,
      attemptCount: true,
      completed: true,
      bestScore: true,
      lastScore: true,
      mastery: true,
      lastAttemptAt: true,
    },
  });

  return new Map(rows.map((row) => [row.readingId, row]));
}

export async function countPublishedReadingsByLevel(level: JapaneseLevel) {
  return prisma.reading.count({
    where: { jlptLevel: level, published: true },
  });
}

export async function findUserReadingProgressRows(userId: string, level: JapaneseLevel) {
  return prisma.userReadingProgress.findMany({
    where: { userId, reading: { jlptLevel: level, published: true } },
    select: {
      mastery: true,
      attemptCount: true,
      completed: true,
      bestScore: true,
      lastScore: true,
    },
  });
}

export async function findRecentReadingSubmissions(userId: string, limit: number) {
  return prisma.readingSubmission.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      correctCount: true,
      totalCount: true,
      scorePercent: true,
      createdAt: true,
      reading: {
        select: {
          title: true,
          slug: true,
          jlptLevel: true,
        },
      },
    },
  });
}
