import "server-only";

import { getDueReviewSummary } from "@/server/learning/daily-learning.service";
import { getUserLearningAnalytics } from "@/server/learning/analytics.service";
import { shouldIncludeProgressContext } from "@/server/tutor/outcome/tutor-outcome-intent";
import type {
  TutorProgressContext,
  TutorProgressHighlight,
} from "@/server/tutor/outcome/tutor-outcome.types";

function computeAccuracyTrend(
  trend: Array<{ accuracy: number; total: number }>,
): "up" | "down" | "flat" | "unknown" {
  const withData = trend.filter((point) => point.total > 0);
  if (withData.length < 2) {
    return "unknown";
  }

  const first = withData[0]?.accuracy ?? 0;
  const last = withData[withData.length - 1]?.accuracy ?? 0;
  const delta = last - first;
  if (Math.abs(delta) < 3) {
    return "flat";
  }
  return delta > 0 ? "up" : "down";
}

function mapRecentHighlights(
  analytics: Awaited<ReturnType<typeof getUserLearningAnalytics>>,
): TutorProgressHighlight[] {
  const highlights: TutorProgressHighlight[] = [];

  for (const item of analytics.recentActivity.slice(0, 5)) {
    if (item.type === "LESSON_COMPLETED") {
      highlights.push({
        type: "LESSON",
        title: item.label.replace(/^Completed lesson:\s*/i, ""),
        occurredAt: item.occurredAt,
      });
      continue;
    }

    if (item.type === "PRACTICE") {
      const scoreMatch = item.label.match(/(\d+)\s*\/\s*(\d+)/);
      const scorePercent =
        scoreMatch && Number.parseInt(scoreMatch[2], 10) > 0
          ? Math.round(
              (Number.parseInt(scoreMatch[1], 10) /
                Number.parseInt(scoreMatch[2], 10)) *
                100,
            )
          : undefined;
      highlights.push({
        type: "PRACTICE",
        title: item.label,
        scorePercent,
        occurredAt: item.occurredAt,
      });
      continue;
    }

    if (item.type === "READING" || item.type === "LISTENING") {
      const scoreMatch = item.label.match(/\((\d+)%\)/);
      highlights.push({
        type: item.type,
        title: item.label.split(" — ")[0]?.replace(/^(Reading|Listening):\s*/i, "") ?? item.label,
        scorePercent: scoreMatch ? Number.parseInt(scoreMatch[1], 10) : undefined,
        occurredAt: item.occurredAt,
      });
    }
  }

  return highlights.slice(0, 5);
}

export async function buildTutorProgressContext(
  userId: string,
  userMessage: string,
): Promise<TutorProgressContext | null> {
  if (!shouldIncludeProgressContext(userMessage)) {
    return null;
  }

  const [analytics, dueReviews] = await Promise.all([
    getUserLearningAnalytics(userId),
    getDueReviewSummary(userId),
  ]);

  return {
    mode: "LEARNER_PROGRESS_SNAPSHOT",
    jlpt: {
      current: analytics.jlpt.currentLevel,
      target: analytics.jlpt.targetLevel,
      targetProgressPercent: analytics.jlpt.targetPathProgress,
    },
    weakSkills: analytics.weaknesses.map((item) => ({
      skill: item.skill,
      masteryPercent: item.masteryPercent,
    })),
    recentAccuracy: {
      value: analytics.practice.recentAccuracy,
      sampleSize: analytics.practice.recentSampleSize,
      trend: computeAccuracyTrend(analytics.accuracyTrend),
    },
    recentHighlights: mapRecentHighlights(analytics),
    dueReviews: { total: dueReviews.total },
  };
}

/** Serialize for size checks in QA — approximate byte length. */
export function estimateProgressContextBytes(context: TutorProgressContext): number {
  return JSON.stringify(context).length;
}
