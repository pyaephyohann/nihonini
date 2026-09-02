import "server-only";

import type { TutorRecommendationActivityType } from "@/lib/validations/tutor";

export type TutorMessageIntent = "OUTCOME" | "PROGRESS" | "NONE";

export type OutcomeConfidence = "HIGH" | "MEDIUM" | "AMBIGUOUS" | "NONE";

export type RecentOutcomeType =
  | "PRACTICE"
  | "LESSON"
  | "READING"
  | "LISTENING"
  | "MOCK_EXAM";

export type RecentLearningOutcome = {
  type: RecentOutcomeType;
  contentId?: string;
  title?: string;
  targetSkill?: string;
  scorePercent?: number;
  correctCount?: number;
  totalCount?: number;
  isCompleted?: boolean;
  occurredAt: string;
};

export type StoredRecommendationSummary = {
  messageId: string;
  occurredAt: string;
  activityType: TutorRecommendationActivityType;
  title: string;
  contentId?: string;
  targetSkill?: string;
};

export type TutorOutcomeContext = {
  mode: "OUTCOME_RESOLUTION";
  recommendation?: StoredRecommendationSummary;
  outcome?: RecentLearningOutcome;
  confidence: OutcomeConfidence;
};

export type TutorProgressHighlight = {
  type: RecentOutcomeType | "LESSON";
  title: string;
  scorePercent?: number;
  occurredAt: string;
};

export type TutorProgressContext = {
  mode: "LEARNER_PROGRESS_SNAPSHOT";
  jlpt: {
    current: string;
    target: string;
    targetProgressPercent: number;
  };
  weakSkills: Array<{ skill: string; masteryPercent: number }>;
  recentAccuracy: {
    value: number | null;
    sampleSize: number;
    trend: "up" | "down" | "flat" | "unknown";
  };
  recentHighlights: TutorProgressHighlight[];
  dueReviews: { total: number };
};
