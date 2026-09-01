import "server-only";

import type { JlptLevelWithLessons, LessonSummary } from "@/types/learning";
import { prisma } from "@/server/db";

export async function findPublishedLessonsByLevel(): Promise<JlptLevelWithLessons[]> {
  const levels = await prisma.jlptLevel.findMany({
    orderBy: { order: "asc" },
    include: {
      lessons: {
        where: { published: true },
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          order: true,
          estimatedMinutes: true,
          jlptLevel: { select: { code: true } },
        },
      },
    },
  });

  return levels.map((level) => ({
    id: level.id,
    code: level.code,
    name: level.name,
    description: level.description,
    order: level.order,
    lessons: level.lessons.map(
      (lesson): LessonSummary => ({
        id: lesson.id,
        title: lesson.title,
        slug: lesson.slug,
        description: lesson.description,
        order: lesson.order,
        estimatedMinutes: lesson.estimatedMinutes,
        jlptLevel: lesson.jlptLevel.code,
      }),
    ),
  }));
}

export async function findPublishedLessonsByLevelForUser(userId: string): Promise<JlptLevelWithLessons[]> {
  const levels = await prisma.jlptLevel.findMany({
    orderBy: { order: "asc" },
    include: {
      lessons: {
        where: { published: true },
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          order: true,
          estimatedMinutes: true,
          jlptLevel: { select: { code: true } },
          progresses: {
            where: { userId },
            select: {
              progress: true,
              status: true,
            },
            take: 1,
          },
        },
      },
    },
  });

  return levels.map((level) => ({
    id: level.id,
    code: level.code,
    name: level.name,
    description: level.description,
    order: level.order,
    lessons: level.lessons.map(
      (lesson): LessonSummary => ({
        id: lesson.id,
        title: lesson.title,
        slug: lesson.slug,
        description: lesson.description,
        order: lesson.order,
        estimatedMinutes: lesson.estimatedMinutes,
        jlptLevel: lesson.jlptLevel.code,
        progressPercent: lesson.progresses[0] ? Math.round(lesson.progresses[0].progress) : 0,
        lessonStatus: lesson.progresses[0]?.status,
      }),
    ),
  }));
}

export async function findPublishedLessonBySlug(slug: string) {
  return prisma.lesson.findFirst({
    where: { slug, published: true },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      order: true,
      estimatedMinutes: true,
      jlptLevel: { select: { code: true } },
      vocabularies: {
        orderBy: { order: "asc" },
        select: {
          order: true,
          vocabulary: {
            select: {
              id: true,
              word: true,
              reading: true,
              meaning: true,
              partOfSpeech: true,
              exampleSentence: true,
              exampleReading: true,
              kanji: {
                orderBy: { order: "asc" },
                select: {
                  kanji: {
                    select: { character: true, meaning: true },
                  },
                },
              },
            },
          },
        },
      },
      grammars: {
        orderBy: { order: "asc" },
        select: {
          order: true,
          grammar: {
            select: {
              id: true,
              pattern: true,
              meaning: true,
              explanation: true,
              structure: true,
              exampleSentence: true,
              exampleReading: true,
            },
          },
        },
      },
      kanjiItems: {
        orderBy: { order: "asc" },
        select: {
          order: true,
          kanji: {
            select: {
              id: true,
              character: true,
              meaning: true,
              onyomi: true,
              kunyomi: true,
              strokeCount: true,
            },
          },
        },
      },
      exercises: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          type: true,
          question: true,
          difficulty: true,
          points: true,
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
