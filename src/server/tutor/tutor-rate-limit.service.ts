import "server-only";

import {
  DUPLICATE_MESSAGE_WINDOW_MS,
  RATE_LIMIT_PER_DAY,
  RATE_LIMIT_PER_MINUTE,
} from "@/server/tutor/tutor.constants";
import { countUserMessagesSince } from "@/server/tutor/tutor.repository";

export const tutorRateLimitErrors = {
  tooFast: "You're sending messages too quickly. Please wait a moment.",
  dailyLimit: "You've reached today's tutor message limit. Please try again tomorrow.",
  duplicateMessage: "Please wait a moment before sending the same message again.",
} as const;

export async function checkTutorRateLimit(userId: string): Promise<{ error: string } | null> {
  const now = Date.now();
  const oneMinuteAgo = new Date(now - 60_000);
  const oneDayAgo = new Date(now - 86_400_000);

  const minuteCount = await countUserMessagesSince(userId, oneMinuteAgo);
  if (minuteCount >= RATE_LIMIT_PER_MINUTE) {
    return { error: tutorRateLimitErrors.tooFast };
  }

  const dayCount = await countUserMessagesSince(userId, oneDayAgo);
  if (dayCount >= RATE_LIMIT_PER_DAY) {
    return { error: tutorRateLimitErrors.dailyLimit };
  }

  return null;
}

export function getDuplicateMessageCutoff(): Date {
  return new Date(Date.now() - DUPLICATE_MESSAGE_WINDOW_MS);
}
