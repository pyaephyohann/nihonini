import "server-only";

import type {
  TutorRecommendationActivityType,
  TutorRecommendationPriority,
  TutorSuggestedActionType,
} from "@/lib/validations/tutor";

export type { TutorRecommendationActivityType, TutorRecommendationPriority };

/** Server-trusted recommendation candidate (includes internal score for ranking). */
export type TutorRecommendationCandidate = {
  id: string;
  type: TutorRecommendationActivityType;
  contentId?: string;
  title: string;
  reason: string;
  priority: TutorRecommendationPriority;
  estimatedMinutes: number;
  targetSkill?: string;
  suggestedAction: {
    type: TutorSuggestedActionType;
    label: string;
  };
  score: number;
};

/** Trusted candidate exposed to the AI prompt (score omitted). */
export type TutorRecommendationTrustedCandidate = Omit<
  TutorRecommendationCandidate,
  "score"
>;

export type TutorRecommendationContext = {
  mode: "PERSONALIZED_RECOMMENDATIONS";
  timeConstraintMinutes: number | null;
  trustedCandidates: TutorRecommendationTrustedCandidate[];
};

export function stripRecommendationScores(
  candidates: TutorRecommendationCandidate[],
): TutorRecommendationTrustedCandidate[] {
  return candidates.map(({ score: _score, ...candidate }) => {
    void _score;
    return candidate;
  });
}
