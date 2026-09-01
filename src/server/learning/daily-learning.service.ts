import "server-only";

import { prisma } from "@/server/db";
import { updateDailyGoalSchema } from "@/lib/validations/learning";
import type { DashboardSnapshot, DueReviewSummary } from "@/types/learning";
import { getJlptPath, getJlptSkillProgress, getNextRecommendedLesson } from "@/server/learning/jlpt.service";

const DAY_MS = 24 * 60 * 60 * 1000;

function getUtcDayRange(date: Date): { start: Date; end: Date } {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const end = new Date(start.getTime() + DAY_MS);
  return { start, end };
}

function toUtcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function getDueReviewSummary(userId: string): Promise<DueReviewSummary> {
  const now = new Date();

  const vocabulary = await prisma.userVocabularyProgress.count({
    where: { userId, nextReviewAt: { lte: now } },
  });
  const grammar = await prisma.userGrammarProgress.count({
    where: { userId, nextReviewAt: { lte: now } },
  });
  const kanji = await prisma.userKanjiProgress.count({
    where: { userId, nextReviewAt: { lte: now } },
  });

  return {
    vocabulary,
    grammar,
    kanji,
    total: vocabulary + grammar + kanji,
  };
}

export async function getDueReviews(userId: string, limit = 20) {
  const now = new Date();
  const [vocabulary, grammar, kanji] = await Promise.all([
    prisma.userVocabularyProgress.findMany({
      where: { userId, nextReviewAt: { lte: now } },
      orderBy: { nextReviewAt: "asc" },
      take: limit,
      select: {
        nextReviewAt: true,
        mastery: true,
        vocabulary: { select: { id: true, word: true, reading: true, meaning: true } },
      },
    }),
    prisma.userGrammarProgress.findMany({
      where: { userId, nextReviewAt: { lte: now } },
      orderBy: { nextReviewAt: "asc" },
      take: limit,
      select: {
        nextReviewAt: true,
        mastery: true,
        grammar: { select: { id: true, pattern: true, meaning: true } },
      },
    }),
    prisma.userKanjiProgress.findMany({
      where: { userId, nextReviewAt: { lte: now } },
      orderBy: { nextReviewAt: "asc" },
      take: limit,
      select: {
        nextReviewAt: true,
        mastery: true,
        kanji: { select: { id: true, character: true, meaning: true } },
      },
    }),
  ]);

  return { vocabulary, grammar, kanji };
}

export async function getDailyActivity(userId: string, dailyGoal: number) {
  const now = new Date();
  const { start, end } = getUtcDayRange(now);

  const completed = await prisma.practiceAttempt.count({
    where: {
      userId,
      createdAt: { gte: start, lt: end },
    },
  });

  const target = Math.max(1, dailyGoal);
  const percentage = Math.min(100, Math.round((completed / target) * 100));

  return { completed, target, percentage };
}

export async function getStreakDays(userId: string, dailyGoal: number): Promise<number> {
  const todayRange = getUtcDayRange(new Date());
  const lookbackStart = new Date(todayRange.start.getTime() - 60 * DAY_MS);

  const attempts = await prisma.practiceAttempt.findMany({
    where: {
      userId,
      createdAt: { gte: lookbackStart, lt: todayRange.end },
    },
    select: { createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const countsByDay = new Map<string, number>();
  for (const attempt of attempts) {
    const key = toUtcDayKey(attempt.createdAt);
    countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1);
  }

  let streak = 0;
  let cursor = todayRange.start;
  const minDailyCount = Math.max(1, dailyGoal);

  for (;;) {
    const key = toUtcDayKey(cursor);
    const count = countsByDay.get(key) ?? 0;
    if (count < minDailyCount) break;
    streak += 1;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }

  return streak;
}

export async function getDashboardSnapshot(userId: string): Promise<DashboardSnapshot> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      dailyGoal: true,
      japaneseLevel: true,
      targetJlptLevel: true,
      learningGoal: true,
    },
  });

  const dailyGoal = profile?.dailyGoal ?? 10;
  const currentLevel = profile?.japaneseLevel ?? "N5";
  const targetLevel = profile?.targetJlptLevel ?? currentLevel;
  const dueReviews = await getDueReviewSummary(userId);
  const dailyProgress = await getDailyActivity(userId, dailyGoal);
  const streakDays = await getStreakDays(userId, dailyGoal);
  const recommendation = await getNextRecommendedLesson(userId);
  const targetSkillProgress = await getJlptSkillProgress(userId, targetLevel);

  return {
    streakDays,
    dueReviews,
    dailyProgress,
    learnerGoal: {
      currentLevel,
      targetLevel,
      learningGoal: profile?.learningGoal ?? "JLPT",
      dailyGoal,
    },
    jlptPath: getJlptPath(currentLevel, targetLevel),
    jlptPreparationProgress: targetSkillProgress.overall,
    jlptSkillProgress: {
      vocabulary: targetSkillProgress.vocabulary,
      grammar: targetSkillProgress.grammar,
      kanji: targetSkillProgress.kanji,
      reading: targetSkillProgress.reading,
      listening: targetSkillProgress.listening,
    },
    continueLearning: {
      lessonTitle: recommendation?.title ?? null,
      lessonSlug: recommendation?.slug ?? null,
      progressPercent: recommendation?.progressPercent ?? 0,
    },
  };
}

export async function getTodaysLearningPlan(
  userId: string,
  japaneseLevel?: "N5" | "N4" | "N3" | "N2" | "N1",
) {
  const inProgress = await prisma.userLessonProgress.findFirst({
    where: {
      userId,
      status: "IN_PROGRESS",
      lesson: { published: true },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      lesson: {
        select: { slug: true, title: true },
      },
    },
  });

  if (inProgress) {
    return {
      lessonTitle: inProgress.lesson.title,
      lessonSlug: inProgress.lesson.slug,
      progressPercent: Math.round(inProgress.progress),
    };
  }

  if (!japaneseLevel) {
    return { lessonTitle: null, lessonSlug: null, progressPercent: 0 };
  }

  const level = await prisma.jlptLevel.findUnique({
    where: { code: japaneseLevel },
    select: { id: true },
  });

  if (!level) {
    return { lessonTitle: null, lessonSlug: null, progressPercent: 0 };
  }

  const completed = await prisma.userLessonProgress.findMany({
    where: { userId, status: "COMPLETED", lesson: { jlptLevelId: level.id } },
    select: { lessonId: true },
  });
  const completedIds = new Set(completed.map((row) => row.lessonId));

  const lessons = await prisma.lesson.findMany({
    where: { jlptLevelId: level.id, published: true },
    orderBy: { order: "asc" },
    select: { id: true, slug: true, title: true },
  });

  const nextLesson = lessons.find((lesson) => !completedIds.has(lesson.id)) ?? lessons[0];

  return {
    lessonTitle: nextLesson?.title ?? null,
    lessonSlug: nextLesson?.slug ?? null,
    progressPercent: 0,
  };
}

export async function updateDailyGoal(input: { userId: string; dailyGoal: number }) {
  const parsed = updateDailyGoalSchema.safeParse({ dailyGoal: input.dailyGoal });
  if (!parsed.success) {
    return { error: "Daily goal must be between 1 and 50." } as const;
  }

  await prisma.profile.update({
    where: { userId: input.userId },
    data: { dailyGoal: parsed.data.dailyGoal },
  });

  return { success: true } as const;
}

