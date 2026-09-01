import "server-only";

type MasteryInput = {
  previousMastery: number;
  correct: boolean;
  attemptCount: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function calculateMastery({
  previousMastery,
  correct,
  attemptCount,
}: MasteryInput): number {
  const baseline = clamp(previousMastery, 0, 1);
  const stabilityPenalty = Math.min(attemptCount, 20) * 0.005;
  const delta = correct ? 0.12 - stabilityPenalty : -0.18 + stabilityPenalty;
  return clamp(Number((baseline + delta).toFixed(4)), 0, 1);
}

export function calculateLessonProgressPercent(correctCount: number, totalCount: number): number {
  if (totalCount <= 0) return 0;
  const raw = (correctCount / totalCount) * 100;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export const LESSON_COMPLETION_THRESHOLD = 80;

/** Items at or above this mastery value (0–1) are considered mastered. */
export const MASTERED_MASTERY_THRESHOLD = 0.8;

