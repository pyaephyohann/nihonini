import type { TutorMessageIntent } from "@/server/tutor/outcome/tutor-outcome.types";

const OUTCOME_PATTERNS = [
  /\bi finished\b/i,
  /\bi completed\b/i,
  /\bi just finished\b/i,
  /\bi just completed\b/i,
  /\bi did the\b/i,
  /\bi finished the\b/i,
  /\bi completed the\b/i,
  /\bi got \d+\s*(?:out of|\/)\s*\d+\b/i,
  /\bi scored\b/i,
  /\bhow did i do\b/i,
  /\bdid i do (?:well|ok|good)\b/i,
  /\bfinished (?:it|the|my)\b/i,
  /\bcompleted (?:it|the|my)\b/i,
  /\bi did (?:the )?(?:practice|reading|listening|lesson|mock)\b/i,
];

const PROGRESS_PATTERNS = [
  /\bam i improving\b/i,
  /\bam i getting better\b/i,
  /\bhow am i doing\b/i,
  /\bwhat(?:'s| is) my progress\b/i,
  /\bhow(?:'s| is) my progress\b/i,
  /\bwhat are my weak\b/i,
  /\bwhat(?:'s| is) my weakest\b/i,
  /\bhow close am i to n[1-5]\b/i,
  /\bwhy am i struggling\b/i,
  /\bhow am i doing with n[1-5]\b/i,
  /\bmy weak skills?\b/i,
  /\bshow me my progress\b/i,
];

/** Whether progress context should be loaded (independent of outcome intent). */
export function shouldIncludeProgressContext(message: string): boolean {
  const normalized = message.trim();
  if (normalized.length === 0) {
    return false;
  }
  return PROGRESS_PATTERNS.some((pattern) => pattern.test(normalized));
}

/** Whether outcome context should be loaded (independent of progress intent). */
export function shouldIncludeOutcomeContext(message: string): boolean {
  const normalized = message.trim();
  if (normalized.length === 0) {
    return false;
  }
  return OUTCOME_PATTERNS.some((pattern) => pattern.test(normalized));
}

/** Detect whether a tutor message warrants outcome or progress server context. */
export function detectTutorMessageIntent(message: string): TutorMessageIntent {
  const normalized = message.trim();
  if (normalized.length === 0) {
    return "NONE";
  }

  const hasOutcome = OUTCOME_PATTERNS.some((pattern) => pattern.test(normalized));
  const hasProgress = PROGRESS_PATTERNS.some((pattern) => pattern.test(normalized));

  if (hasOutcome && !hasProgress) {
    return "OUTCOME";
  }
  if (hasProgress && !hasOutcome) {
    return "PROGRESS";
  }
  if (hasOutcome && hasProgress) {
    if (/\bhow did i do\b/i.test(normalized) || /\bi (?:finished|completed|got)\b/i.test(normalized)) {
      return "OUTCOME";
    }
    return "PROGRESS";
  }

  return "NONE";
}

/** Extract a user-claimed score for diagnostics only — never authoritative. */
export function parseUserClaimedScore(message: string): {
  correct: number;
  total: number;
} | null {
  const match = message.match(/\b(\d+)\s*(?:out of|\/)\s*(\d+)\b/i);
  if (!match) {
    return null;
  }

  const correct = Number.parseInt(match[1], 10);
  const total = Number.parseInt(match[2], 10);
  if (!Number.isFinite(correct) || !Number.isFinite(total) || total <= 0) {
    return null;
  }

  return { correct, total };
}
