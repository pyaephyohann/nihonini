/** Detect study-recommendation intent from natural-language tutor messages. */
const RECOMMENDATION_INTENT_PATTERNS = [
  /what should i (study|learn|practice)/i,
  /what (to|should i) (study|learn|practice)/i,
  /what'?s my (weakest|weak)/i,
  /weakest (area|skill|subject)/i,
  /recommend/i,
  /next (step|study|lesson|activity)/i,
  /help me study/i,
  /prepare for n[1-5]/i,
  /study (now|today|next)/i,
  /practice today/i,
  /learning plan/i,
  /what do you suggest/i,
  /only have \d+/i,
  /\d+\s*(min(?:ute)?s?|minutes)/i,
  /half an hour/i,
];

export function detectRecommendationIntent(message: string): boolean {
  const normalized = message.trim();
  if (normalized.length === 0) {
    return false;
  }
  return RECOMMENDATION_INTENT_PATTERNS.some((pattern) => pattern.test(normalized));
}

/** Parse per-request time budget from the current message only (not persisted). */
export function parseTimeConstraintMinutes(message: string): number | null {
  const normalized = message.trim();

  const onlyHave = normalized.match(/only have (\d+)\s*(?:min(?:ute)?s?)?/i);
  if (onlyHave) {
    const minutes = Number.parseInt(onlyHave[1], 10);
    return Number.isFinite(minutes) && minutes > 0 ? Math.min(minutes, 180) : null;
  }

  const explicit = normalized.match(/(\d+)\s*(?:min(?:ute)?s?|minutes)/i);
  if (explicit) {
    const minutes = Number.parseInt(explicit[1], 10);
    return Number.isFinite(minutes) && minutes > 0 ? Math.min(minutes, 180) : null;
  }

  if (/half an hour/i.test(normalized)) {
    return 30;
  }

  return null;
}
