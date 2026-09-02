import "server-only";

import type { TutorResponseInput } from "@/lib/validations/tutor";
import { validateTutorResponsePayload } from "@/server/tutor/tutor-safety";
import {
  DEFAULT_RECENT_OUTCOME_WINDOW_MS,
  STALE_OUTCOME_THRESHOLD_MS,
  getRecentLearningOutcomes,
  mapRecommendationTypeToOutcome,
} from "@/server/learning/recent-outcomes.service";
import { findConversationForUser, loadMessagesForConversation } from "@/server/tutor/tutor.repository";
import { shouldIncludeOutcomeContext } from "@/server/tutor/outcome/tutor-outcome-intent";
import type {
  OutcomeConfidence,
  RecentLearningOutcome,
  StoredRecommendationSummary,
  TutorOutcomeContext,
} from "@/server/tutor/outcome/tutor-outcome.types";

type StoredRecommendationMessage = {
  messageId: string;
  occurredAt: Date;
  recommendations: Extract<TutorResponseInput, { type: "RECOMMENDATION" }>["recommendations"];
};

function findLastRecommendationMessage(
  messages: Array<{
    id: string;
    role: "USER" | "ASSISTANT";
    createdAt: Date;
    responseJson: unknown;
  }>,
): StoredRecommendationMessage | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== "ASSISTANT") {
      continue;
    }

    const parsed = validateTutorResponsePayload(message.responseJson);
    if (parsed?.type === "RECOMMENDATION") {
      return {
        messageId: message.id,
        occurredAt: message.createdAt,
        recommendations: parsed.recommendations,
      };
    }
  }

  return null;
}

function toRecommendationSummary(
  messageId: string,
  occurredAt: Date,
  item: StoredRecommendationMessage["recommendations"][number],
): StoredRecommendationSummary {
  return {
    messageId,
    occurredAt: occurredAt.toISOString(),
    activityType: item.type,
    title: item.title,
    contentId: item.contentId,
    targetSkill: item.targetSkill,
  };
}

function normalizeSkill(value: string | undefined): string | undefined {
  return value?.trim().toUpperCase();
}

function computeMatchScore(input: {
  recommendation: StoredRecommendationSummary;
  outcome: RecentLearningOutcome;
  recommendationAt: Date;
}): number {
  const { recommendation, outcome, recommendationAt } = input;
  const expectedType = mapRecommendationTypeToOutcome(recommendation.activityType);
  if (!expectedType || expectedType !== outcome.type) {
    return 0;
  }

  let score = 40;

  if (
    recommendation.contentId &&
    outcome.contentId &&
    recommendation.contentId === outcome.contentId
  ) {
    score += 50;
  }

  const recSkill = normalizeSkill(recommendation.targetSkill);
  const outcomeSkill = normalizeSkill(outcome.targetSkill);
  if (recSkill && outcomeSkill && recSkill === outcomeSkill) {
    score += 30;
  }

  const outcomeTime = new Date(outcome.occurredAt).getTime();
  const recTime = recommendationAt.getTime();
  if (outcomeTime >= recTime) {
    score += 10;
  }

  const hoursAfter = (outcomeTime - recTime) / (60 * 60 * 1000);
  if (hoursAfter >= 0 && hoursAfter <= 24) {
    score += 20;
  } else if (hoursAfter <= 48) {
    score += 10;
  }

  if (outcomeTime - recTime > STALE_OUTCOME_THRESHOLD_MS) {
    score = Math.min(score, 55);
  }

  return score;
}

function scoreToConfidence(
  score: number,
  hasContentMatch: boolean,
  isStale: boolean,
): OutcomeConfidence {
  if (score <= 0) {
    return "NONE";
  }
  if (isStale) {
    return score >= 70 ? "MEDIUM" : "AMBIGUOUS";
  }
  if (hasContentMatch && score >= 80) {
    return "HIGH";
  }
  if (score >= 70) {
    return "HIGH";
  }
  if (score >= 50) {
    return "MEDIUM";
  }
  return "AMBIGUOUS";
}

export function resolveRecommendationOutcomeMatch(input: {
  recommendationMessage: StoredRecommendationMessage | null;
  outcomes: RecentLearningOutcome[];
}): {
  recommendation?: StoredRecommendationSummary;
  outcome?: RecentLearningOutcome;
  confidence: OutcomeConfidence;
} {
  if (!input.recommendationMessage || input.recommendationMessage.recommendations.length === 0) {
    const latest = input.outcomes[0];
    return latest
      ? { outcome: latest, confidence: "AMBIGUOUS" }
      : { confidence: "NONE" };
  }

  const recommendationAt = input.recommendationMessage.occurredAt;
  let best:
    | {
        recommendation: StoredRecommendationSummary;
        outcome: RecentLearningOutcome;
        score: number;
        hasContentMatch: boolean;
        isStale: boolean;
      }
    | undefined;

  const contenders: typeof best[] = [];

  for (const item of input.recommendationMessage.recommendations) {
    const summary = toRecommendationSummary(
      input.recommendationMessage.messageId,
      recommendationAt,
      item,
    );

    if (item.type === "TUTOR_PRACTICE") {
      continue;
    }

    for (const outcome of input.outcomes) {
      const score = computeMatchScore({
        recommendation: summary,
        outcome,
        recommendationAt,
      });
      if (score <= 0) {
        continue;
      }

      const hasContentMatch = Boolean(
        summary.contentId &&
          outcome.contentId &&
          summary.contentId === outcome.contentId,
      );
      const isStale =
        new Date(outcome.occurredAt).getTime() - recommendationAt.getTime() >
        STALE_OUTCOME_THRESHOLD_MS;

      const candidate = {
        recommendation: summary,
        outcome,
        score,
        hasContentMatch,
        isStale,
      };
      contenders.push(candidate);

      if (!best || score > best.score) {
        best = candidate;
      }
    }
  }

  if (!best) {
    return { confidence: "NONE" };
  }

  const closeMatches = contenders.filter(
    (item) => item && best && Math.abs(item.score - best.score) <= 5,
  );
  if (closeMatches.length > 1) {
    const uniqueOutcomes = new Set(closeMatches.map((item) => item!.outcome.occurredAt));
    if (uniqueOutcomes.size > 1) {
      return {
        recommendation: best.recommendation,
        confidence: "AMBIGUOUS",
      };
    }
  }

  return {
    recommendation: best.recommendation,
    outcome: best.outcome,
    confidence: scoreToConfidence(best.score, best.hasContentMatch, best.isStale),
  };
}

export async function buildTutorOutcomeContext(input: {
  userId: string;
  conversationId: string;
  userMessage: string;
}): Promise<TutorOutcomeContext | null> {
  if (!shouldIncludeOutcomeContext(input.userMessage)) {
    return null;
  }

  const conversation = await findConversationForUser(input.conversationId, input.userId);
  if (!conversation) {
    return null;
  }

  const loaded = await loadMessagesForConversation(input.conversationId, input.userId);
  if (!loaded) {
    return null;
  }

  const recommendationMessage = findLastRecommendationMessage(loaded.messages);
  const since = new Date(Date.now() - DEFAULT_RECENT_OUTCOME_WINDOW_MS);

  const outcomes = await getRecentLearningOutcomes(input.userId, { since });
  const resolved = resolveRecommendationOutcomeMatch({
    recommendationMessage,
    outcomes,
  });

  return {
    mode: "OUTCOME_RESOLUTION",
    recommendation: resolved.recommendation,
    outcome: resolved.outcome,
    confidence: resolved.confidence,
  };
}

/** Exposed for QA — match without DB conversation load. */
export { findLastRecommendationMessage, resolveRecommendationOutcomeMatch as matchRecommendationToOutcome };
