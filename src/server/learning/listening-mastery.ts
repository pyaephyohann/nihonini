import "server-only";

import {
  calculateMastery,
  LESSON_COMPLETION_THRESHOLD,
  MASTERED_MASTERY_THRESHOLD,
} from "@/server/learning/mastery";

/**
 * Listening mastery uses the shared calculateMastery() function.
 * Each completed listening submission counts as one attempt.
 * A session passes when scorePercent >= LESSON_COMPLETION_THRESHOLD (80%).
 */
export function updateListeningMastery(
  previousMastery: number,
  scorePercent: number,
  attemptCount: number,
): number {
  const sessionPassed = scorePercent >= LESSON_COMPLETION_THRESHOLD;
  return calculateMastery({
    previousMastery,
    correct: sessionPassed,
    attemptCount,
  });
}

export function isListeningMastered(mastery: number): boolean {
  return mastery >= MASTERED_MASTERY_THRESHOLD;
}

export function calculateListeningScorePercent(
  correctCount: number,
  totalCount: number,
): number {
  if (totalCount <= 0) return 0;
  return Math.round(Math.min(100, Math.max(0, (correctCount / totalCount) * 100)));
}
