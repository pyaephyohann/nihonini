import "server-only";

import { cache } from "react";
import type { JapaneseLevel } from "@/generated/prisma/client";
import { MASTERED_MASTERY_THRESHOLD } from "@/server/learning/mastery";
import {
  getJlptPath,
  getUserJlptCurriculum,
} from "@/server/learning/jlpt.service";
import {
  getReadingSkillMetrics,
  getRecentReadingActivity,
} from "@/server/learning/reading.service";
import {
  getListeningSkillMetrics,
  getRecentListeningActivity,
} from "@/server/learning/listening.service";
import { getMockExamAssessmentMetrics } from "@/server/learning/mock-exam.service";
import { prisma } from "@/server/db";
import type {
  LearningAnalytics,
  PracticeSkill,
  SkillAnalytics,
  SkillInsight,
} from "@/types/learning";

const DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_ATTEMPT_LIMIT = 20;
const ACCURACY_TREND_DAYS = 7;

function roundPercent(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)));
}

function safeAccuracy(correct: number, total: number): number | null {
  if (total <= 0) return null;
  return roundPercent((correct / total) * 100);
}

function toUtcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatDayLabel(dayKey: string): string {
  const date = new Date(`${dayKey}T00:00:00.000Z`);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

type SkillProgressRow = {
  mastery: number;
  attemptCount: number;
  nextReviewAt: Date | null;
};

function averageMasteryPercent(
  progressRows: SkillProgressRow[],
  totalItems: number,
): number {
  if (totalItems <= 0) return 0;
  const masterySum = progressRows.reduce((sum, row) => sum + row.mastery, 0);
  return roundPercent((masterySum / totalItems) * 100);
}

async function getSkillContentCounts(level: JapaneseLevel) {
  const [vocabulary, grammar, kanji] = await Promise.all([
    prisma.vocabulary.count({ where: { jlptLevel: level } }),
    prisma.grammar.count({ where: { jlptLevel: level } }),
    prisma.kanji.count({ where: { jlptLevel: level } }),
  ]);
  return { vocabulary, grammar, kanji };
}

async function getVocabularyProgressRows(
  userId: string,
  level: JapaneseLevel,
): Promise<SkillProgressRow[]> {
  const rows = await prisma.userVocabularyProgress.findMany({
    where: { userId, vocabulary: { jlptLevel: level } },
    select: { mastery: true, attemptCount: true, nextReviewAt: true },
  });
  return rows;
}

async function getGrammarProgressRows(
  userId: string,
  level: JapaneseLevel,
): Promise<SkillProgressRow[]> {
  const rows = await prisma.userGrammarProgress.findMany({
    where: { userId, grammar: { jlptLevel: level } },
    select: { mastery: true, attemptCount: true, nextReviewAt: true },
  });
  return rows;
}

async function getKanjiProgressRows(
  userId: string,
  level: JapaneseLevel,
): Promise<SkillProgressRow[]> {
  const rows = await prisma.userKanjiProgress.findMany({
    where: { userId, kanji: { jlptLevel: level } },
    select: { mastery: true, attemptCount: true, nextReviewAt: true },
  });
  return rows;
}

function buildSkillAnalytics(input: {
  skill: PracticeSkill;
  totalItems: number;
  progressRows: SkillProgressRow[];
  masteryPercent: number;
  accuracy: number | null;
}): SkillAnalytics {
  const { skill, totalItems, progressRows, masteryPercent, accuracy } = input;
  const now = new Date();
  const itemsStarted = progressRows.filter((row) => row.attemptCount > 0).length;
  const itemsMastered = progressRows.filter(
    (row) => row.mastery >= MASTERED_MASTERY_THRESHOLD,
  ).length;
  const itemsInProgress = progressRows.filter(
    (row) =>
      row.attemptCount > 0 && row.mastery < MASTERED_MASTERY_THRESHOLD,
  ).length;
  const dueReviews = progressRows.filter(
    (row) => row.nextReviewAt !== null && row.nextReviewAt <= now,
  ).length;

  return {
    skill,
    masteryPercent,
    accuracy,
    totalItems,
    itemsStarted,
    itemsMastered,
    itemsInProgress,
    dueReviews,
    hasData: itemsStarted > 0 || totalItems > 0,
  };
}

async function getSkillPracticeAccuracy(
  userId: string,
  skill: PracticeSkill,
  level: JapaneseLevel,
): Promise<number | null> {
  const exerciseFilter =
    skill === "VOCABULARY"
      ? { vocabularyTargets: { some: { vocabulary: { jlptLevel: level } } } }
      : skill === "GRAMMAR"
        ? { grammarTargets: { some: { grammar: { jlptLevel: level } } } }
        : { kanjiTargets: { some: { kanji: { jlptLevel: level } } } };

  const [total, correct] = await Promise.all([
    prisma.practiceAttempt.count({
      where: { userId, exercise: exerciseFilter },
    }),
    prisma.practiceAttempt.count({
      where: { userId, isCorrect: true, exercise: exerciseFilter },
    }),
  ]);

  return safeAccuracy(correct, total);
}

function computeSkillProgress(
  contentCounts: { vocabulary: number; grammar: number; kanji: number },
  vocabRows: SkillProgressRow[],
  grammarRows: SkillProgressRow[],
  kanjiRows: SkillProgressRow[],
) {
  const vocabulary = averageMasteryPercent(vocabRows, contentCounts.vocabulary);
  const grammar = averageMasteryPercent(grammarRows, contentCounts.grammar);
  const kanji = averageMasteryPercent(kanjiRows, contentCounts.kanji);

  const available = [
    contentCounts.vocabulary > 0 ? vocabulary : null,
    contentCounts.grammar > 0 ? grammar : null,
    contentCounts.kanji > 0 ? kanji : null,
  ].filter((value): value is number => value !== null);

  const overall = available.length
    ? roundPercent(available.reduce((sum, value) => sum + value, 0) / available.length)
    : 0;

  return { vocabulary, grammar, kanji, overall };
}

function buildSkillRankings(
  level: JapaneseLevel,
  contentCounts: { vocabulary: number; grammar: number; kanji: number },
  vocabRows: SkillProgressRow[],
  grammarRows: SkillProgressRow[],
  kanjiRows: SkillProgressRow[],
): SkillInsight[] {
  const skillProgress = computeSkillProgress(
    contentCounts,
    vocabRows,
    grammarRows,
    kanjiRows,
  );

  const rankings: SkillInsight[] = [
    {
      skill: "VOCABULARY",
      level,
      masteryPercent: skillProgress.vocabulary,
      itemsStarted: vocabRows.filter((row) => row.attemptCount > 0).length,
    },
    {
      skill: "GRAMMAR",
      level,
      masteryPercent: skillProgress.grammar,
      itemsStarted: grammarRows.filter((row) => row.attemptCount > 0).length,
    },
    {
      skill: "KANJI",
      level,
      masteryPercent: skillProgress.kanji,
      itemsStarted: kanjiRows.filter((row) => row.attemptCount > 0).length,
    },
  ];

  return rankings.filter(
    (row) =>
      row.itemsStarted > 0 ||
      (row.skill === "VOCABULARY"
        ? contentCounts.vocabulary > 0
        : row.skill === "GRAMMAR"
          ? contentCounts.grammar > 0
          : contentCounts.kanji > 0),
  );
}

export async function getSkillMasteryRankings(
  userId: string,
  level: JapaneseLevel,
): Promise<SkillInsight[]> {
  const contentCounts = await getSkillContentCounts(level);
  const vocabRows = await getVocabularyProgressRows(userId, level);
  const grammarRows = await getGrammarProgressRows(userId, level);
  const kanjiRows = await getKanjiProgressRows(userId, level);

  return buildSkillRankings(level, contentCounts, vocabRows, grammarRows, kanjiRows);
}

export async function getWeakSkills(
  userId: string,
  level: JapaneseLevel,
  limit = 2,
): Promise<SkillInsight[]> {
  const rankings = await getSkillMasteryRankings(userId, level);
  return [...rankings]
    .filter((row) => row.itemsStarted > 0)
    .sort((a, b) => a.masteryPercent - b.masteryPercent)
    .slice(0, limit);
}

export async function getStrongSkills(
  userId: string,
  level: JapaneseLevel,
  limit = 2,
): Promise<SkillInsight[]> {
  const rankings = await getSkillMasteryRankings(userId, level);
  return [...rankings]
    .filter((row) => row.itemsStarted > 0)
    .sort((a, b) => b.masteryPercent - a.masteryPercent)
    .slice(0, limit);
}

async function loadUserLearningAnalytics(
  userId: string,
): Promise<LearningAnalytics> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      japaneseLevel: true,
      targetJlptLevel: true,
    },
  });

  const currentLevel = profile?.japaneseLevel ?? "N5";
  const targetLevel = profile?.targetJlptLevel ?? currentLevel;
  const path = getJlptPath(currentLevel, targetLevel);

  const curriculum = await getUserJlptCurriculum(userId);

  const currentContentCounts = await getSkillContentCounts(currentLevel);
  const currentVocabRows = await getVocabularyProgressRows(userId, currentLevel);
  const currentGrammarRows = await getGrammarProgressRows(userId, currentLevel);
  const currentKanjiRows = await getKanjiProgressRows(userId, currentLevel);
  const currentSkillProgress = computeSkillProgress(
    currentContentCounts,
    currentVocabRows,
    currentGrammarRows,
    currentKanjiRows,
  );

  let targetSkillProgress = currentSkillProgress;
  if (targetLevel !== currentLevel) {
    const targetContentCounts = await getSkillContentCounts(targetLevel);
    const targetVocabRows = await getVocabularyProgressRows(userId, targetLevel);
    const targetGrammarRows = await getGrammarProgressRows(userId, targetLevel);
    const targetKanjiRows = await getKanjiProgressRows(userId, targetLevel);
    targetSkillProgress = computeSkillProgress(
      targetContentCounts,
      targetVocabRows,
      targetGrammarRows,
      targetKanjiRows,
    );
  }

  const vocabAccuracy = await getSkillPracticeAccuracy(
    userId,
    "VOCABULARY",
    currentLevel,
  );
  const grammarAccuracy = await getSkillPracticeAccuracy(
    userId,
    "GRAMMAR",
    currentLevel,
  );
  const kanjiAccuracy = await getSkillPracticeAccuracy(userId, "KANJI", currentLevel);
  const readingMetrics = await getReadingSkillMetrics(userId, currentLevel);
  const listeningMetrics = await getListeningSkillMetrics(userId, currentLevel);

  const totalAttempts = await prisma.practiceAttempt.count({ where: { userId } });
  const correctAttempts = await prisma.practiceAttempt.count({
    where: { userId, isCorrect: true },
  });
  const recentAttempts = await prisma.practiceAttempt.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: RECENT_ATTEMPT_LIMIT,
    select: { isCorrect: true, createdAt: true },
  });

  const completedLessons = await prisma.userLessonProgress.count({
    where: { userId, status: "COMPLETED", lesson: { published: true } },
  });
  const totalLessons = await prisma.lesson.count({ where: { published: true } });
  const recentLessonCompletions = await prisma.userLessonProgress.findMany({
    where: {
      userId,
      status: "COMPLETED",
      completedAt: { not: null },
      lesson: { published: true },
    },
    orderBy: { completedAt: "desc" },
    take: 5,
    select: {
      completedAt: true,
      lesson: { select: { title: true, slug: true } },
    },
  });

  const pathLevelOverviews = curriculum.levels.filter((level) =>
    path.includes(level.level),
  );
  const targetPathProgress =
    pathLevelOverviews.length > 0
      ? roundPercent(
          pathLevelOverviews.reduce((sum, level) => sum + level.progressPercent, 0) /
            pathLevelOverviews.length,
        )
      : 0;

  const recentCorrect = recentAttempts.filter((row) => row.isCorrect).length;
  const overallAccuracy = safeAccuracy(correctAttempts, totalAttempts);
  const recentAccuracy = safeAccuracy(recentCorrect, recentAttempts.length);

  const trendStart = new Date(
    Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate(),
    ) -
      (ACCURACY_TREND_DAYS - 1) * DAY_MS,
  );

  const trendAttempts = await prisma.practiceAttempt.findMany({
    where: { userId, createdAt: { gte: trendStart } },
    select: { isCorrect: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  const recentReading = await getRecentReadingActivity(userId, 5);
  const recentListening = await getRecentListeningActivity(userId, 5);
  const mockExam = await getMockExamAssessmentMetrics(userId);

  const trendByDay = new Map<string, { total: number; correct: number }>();
  for (const attempt of trendAttempts) {
    const key = toUtcDayKey(attempt.createdAt);
    const current = trendByDay.get(key) ?? { total: 0, correct: 0 };
    current.total += 1;
    if (attempt.isCorrect) current.correct += 1;
    trendByDay.set(key, current);
  }

  const accuracyTrend = Array.from(trendByDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, stats]) => ({
      day,
      label: formatDayLabel(day),
      accuracy: safeAccuracy(stats.correct, stats.total) ?? 0,
      total: stats.total,
    }));

  const practiceByDay = new Map<string, { total: number; correct: number }>();
  for (const attempt of trendAttempts) {
    const key = toUtcDayKey(attempt.createdAt);
    const current = practiceByDay.get(key) ?? { total: 0, correct: 0 };
    current.total += 1;
    if (attempt.isCorrect) current.correct += 1;
    practiceByDay.set(key, current);
  }

  const recentPracticeDays = Array.from(practiceByDay.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 5)
    .map(([day, stats]) => ({
      day,
      label: formatDayLabel(day),
      totalQuestions: stats.total,
      correctAnswers: stats.correct,
      accuracy: safeAccuracy(stats.correct, stats.total) ?? 0,
    }));

  const recentActivity = [
    ...recentLessonCompletions.map((row) => ({
      type: "LESSON_COMPLETED" as const,
      label: `Completed lesson: ${row.lesson.title}`,
      href: `/app/learn/${row.lesson.slug}`,
      occurredAt: row.completedAt!.toISOString(),
    })),
    ...recentPracticeDays.map((row) => ({
      type: "PRACTICE" as const,
      label: `Practice: ${row.correctAnswers} / ${row.totalQuestions} correct`,
      href: "/app/practice",
      occurredAt: `${row.day}T12:00:00.000Z`,
    })),
    ...recentReading.map((row) => ({
      type: "READING" as const,
      label: `Reading: ${row.title} — ${row.correctCount} / ${row.totalCount} (${row.scorePercent}%)`,
      href: `/app/learn/reading/${row.slug}`,
      occurredAt: row.occurredAt,
    })),
    ...recentListening.map((row) => ({
      type: "LISTENING" as const,
      label: `Listening: ${row.title} — ${row.correctCount} / ${row.totalCount} (${row.scorePercent}%)`,
      href: `/app/learn/listening/${row.slug}`,
      occurredAt: row.occurredAt,
    })),
  ]
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, 8);

  const rankings = buildSkillRankings(
    currentLevel,
    currentContentCounts,
    currentVocabRows,
    currentGrammarRows,
    currentKanjiRows,
  );
  const weaknesses = [...rankings]
    .filter((row) => row.itemsStarted > 0)
    .sort((a, b) => a.masteryPercent - b.masteryPercent)
    .slice(0, 2);
  const strengths = [...rankings]
    .filter((row) => row.itemsStarted > 0)
    .sort((a, b) => b.masteryPercent - a.masteryPercent)
    .slice(0, 2);

  const readingSubmissionCount = await prisma.readingSubmission.count({
    where: { userId },
  });
  const listeningSubmissionCount = await prisma.listeningSubmission.count({
    where: { userId },
  });
  const hasActivity =
    totalAttempts > 0 ||
    completedLessons > 0 ||
    readingSubmissionCount > 0 ||
    listeningSubmissionCount > 0;

  return {
    hasActivity,
    overall: {
      masteryPercent: targetSkillProgress.overall,
      accuracy: overallAccuracy,
      completedLessons,
      totalLessons,
    },
    skills: {
      vocabulary: buildSkillAnalytics({
        skill: "VOCABULARY",
        totalItems: currentContentCounts.vocabulary,
        progressRows: currentVocabRows,
        masteryPercent: currentSkillProgress.vocabulary,
        accuracy: vocabAccuracy,
      }),
      grammar: buildSkillAnalytics({
        skill: "GRAMMAR",
        totalItems: currentContentCounts.grammar,
        progressRows: currentGrammarRows,
        masteryPercent: currentSkillProgress.grammar,
        accuracy: grammarAccuracy,
      }),
      kanji: buildSkillAnalytics({
        skill: "KANJI",
        totalItems: currentContentCounts.kanji,
        progressRows: currentKanjiRows,
        masteryPercent: currentSkillProgress.kanji,
        accuracy: kanjiAccuracy,
      }),
      reading: readingMetrics
        ? {
            skill: "READING" as const,
            masteryPercent: readingMetrics.masteryPercent,
            accuracy: readingMetrics.accuracy,
            totalItems: readingMetrics.totalItems,
            itemsStarted: readingMetrics.itemsStarted,
            itemsMastered: readingMetrics.itemsMastered,
            itemsInProgress: readingMetrics.itemsInProgress,
            dueReviews: 0,
            hasData: readingMetrics.hasData,
          }
        : null,
      listening: listeningMetrics
        ? {
            skill: "LISTENING" as const,
            masteryPercent: listeningMetrics.masteryPercent,
            accuracy: listeningMetrics.accuracy,
            totalItems: listeningMetrics.totalItems,
            itemsStarted: listeningMetrics.itemsStarted,
            itemsMastered: listeningMetrics.itemsMastered,
            itemsInProgress: listeningMetrics.itemsInProgress,
            dueReviews: 0,
            hasData: listeningMetrics.hasData,
          }
        : null,
    },
    recentReading,
    recentListening,
    mockExam,
    practice: {
      totalAttempts,
      totalQuestions: totalAttempts,
      correctAnswers: correctAttempts,
      incorrectAnswers: Math.max(0, totalAttempts - correctAttempts),
      accuracy: overallAccuracy,
      recentAccuracy,
      recentSampleSize: recentAttempts.length,
    },
    jlpt: {
      currentLevel,
      targetLevel,
      path,
      targetPathProgress,
      currentLevelProgress: currentSkillProgress.overall,
      levels: curriculum.levels.map((level) => ({
        level: level.level,
        name: level.name,
        progressPercent: level.progressPercent,
        lessonCount: level.lessonCount,
        completedLessons: level.completedLessons,
        isCurrent: level.isCurrent,
        isTarget: level.isTarget,
        hasContent: level.lessonCount > 0,
      })),
    },
    weaknesses,
    strengths,
    accuracyTrend,
    recentPracticeDays,
    recentActivity,
  };
}

export const getUserLearningAnalytics = cache(loadUserLearningAnalytics);
