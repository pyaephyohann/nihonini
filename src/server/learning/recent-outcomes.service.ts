import "server-only";

import type { RecentLearningOutcome, RecentOutcomeType } from "@/server/tutor/outcome/tutor-outcome.types";
import { findLatestMockExamSession } from "@/server/learning/mock-exam.repository";
import { findRecentListeningSubmissions } from "@/server/learning/listening.repository";
import { findRecentReadingSubmissions } from "@/server/learning/reading.repository";
import { prisma } from "@/server/db";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_RECENT_OUTCOME_WINDOW_MS = 48 * HOUR_MS;
export const STALE_OUTCOME_THRESHOLD_MS = 7 * DAY_MS;

type PracticeSkill = "VOCABULARY" | "GRAMMAR" | "KANJI";

function inferPracticeSkill(exercise: {
  vocabularyTargets: unknown[];
  grammarTargets: unknown[];
  kanjiTargets: unknown[];
}): PracticeSkill | undefined {
  if (exercise.grammarTargets.length > 0) {
    return "GRAMMAR";
  }
  if (exercise.vocabularyTargets.length > 0) {
    return "VOCABULARY";
  }
  if (exercise.kanjiTargets.length > 0) {
    return "KANJI";
  }
  return undefined;
}

function mapRecommendationTypeToOutcome(
  type: string,
): RecentOutcomeType | null {
  switch (type) {
    case "PRACTICE":
    case "REVIEW":
    case "TUTOR_PRACTICE":
      return type === "TUTOR_PRACTICE" ? null : "PRACTICE";
    case "LESSON":
      return "LESSON";
    case "READING":
      return "READING";
    case "LISTENING":
      return "LISTENING";
    case "MOCK_EXAM":
      return "MOCK_EXAM";
    default:
      return null;
  }
}

export { mapRecommendationTypeToOutcome };

export async function getRecentLearningOutcomes(
  userId: string,
  options?: {
    since?: Date;
    limit?: number;
  },
): Promise<RecentLearningOutcome[]> {
  const since =
    options?.since ?? new Date(Date.now() - DEFAULT_RECENT_OUTCOME_WINDOW_MS);
  const limit = options?.limit ?? 25;

  const [attempts, lessonUpdates, readings, listenings, mockExam] = await Promise.all([
    prisma.practiceAttempt.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        isCorrect: true,
        createdAt: true,
        exercise: {
          select: {
            id: true,
            lesson: { select: { title: true, slug: true } },
            vocabularyTargets: { select: { vocabularyId: true }, take: 1 },
            grammarTargets: { select: { grammarId: true }, take: 1 },
            kanjiTargets: { select: { kanjiId: true }, take: 1 },
          },
        },
      },
    }),
    prisma.userLessonProgress.findMany({
      where: {
        userId,
        updatedAt: { gte: since },
        lesson: { published: true },
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: {
        status: true,
        progress: true,
        updatedAt: true,
        completedAt: true,
        lesson: { select: { title: true, slug: true } },
      },
    }),
    findRecentReadingSubmissions(userId, limit),
    findRecentListeningSubmissions(userId, limit),
    findLatestMockExamSession(userId),
  ]);

  const outcomes: RecentLearningOutcome[] = [];

  for (const attempt of attempts) {
    const skill = inferPracticeSkill(attempt.exercise);
    outcomes.push({
      type: "PRACTICE",
      contentId: attempt.exercise.id,
      title: attempt.exercise.lesson.title,
      targetSkill: skill,
      scorePercent: attempt.isCorrect ? 100 : 0,
      correctCount: attempt.isCorrect ? 1 : 0,
      totalCount: 1,
      isCompleted: true,
      occurredAt: attempt.createdAt.toISOString(),
    });
  }

  for (const row of lessonUpdates) {
    outcomes.push({
      type: "LESSON",
      contentId: row.lesson.slug,
      title: row.lesson.title,
      scorePercent: Math.round(row.progress),
      isCompleted: row.status === "COMPLETED",
      occurredAt: (row.completedAt ?? row.updatedAt).toISOString(),
    });
  }

  for (const row of readings) {
    if (row.createdAt < since) {
      continue;
    }
    outcomes.push({
      type: "READING",
      contentId: row.reading.slug,
      title: row.reading.title,
      scorePercent: row.scorePercent,
      correctCount: row.correctCount,
      totalCount: row.totalCount,
      isCompleted: true,
      occurredAt: row.createdAt.toISOString(),
    });
  }

  for (const row of listenings) {
    if (row.createdAt < since) {
      continue;
    }
    outcomes.push({
      type: "LISTENING",
      contentId: row.listening.slug,
      title: row.listening.title,
      scorePercent: row.scorePercent,
      correctCount: row.correctCount,
      totalCount: row.totalCount,
      isCompleted: true,
      occurredAt: row.createdAt.toISOString(),
    });
  }

  if (
    mockExam?.submittedAt &&
    mockExam.submittedAt >= since &&
    mockExam.scorePercent !== null
  ) {
    outcomes.push({
      type: "MOCK_EXAM",
      contentId: mockExam.mockExam.slug,
      title: mockExam.mockExam.title,
      scorePercent: mockExam.scorePercent,
      isCompleted: true,
      occurredAt: mockExam.submittedAt.toISOString(),
    });
  }

  return outcomes
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, limit);
}
