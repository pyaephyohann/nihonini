import "server-only";

type SchedulerInput = {
  correct: boolean;
  correctCount: number;
  mastery: number;
  now?: Date;
};

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function calculateNextReviewAt({
  correct,
  correctCount,
  mastery,
  now = new Date(),
}: SchedulerInput): Date {
  if (!correct) {
    return addMinutes(now, 10);
  }

  if (correctCount <= 1) return addDays(now, 1);
  if (correctCount <= 3) return addDays(now, mastery >= 0.5 ? 3 : 1);
  if (correctCount <= 5) return addDays(now, mastery >= 0.65 ? 7 : 3);
  if (correctCount <= 8) return addDays(now, mastery >= 0.75 ? 14 : 7);
  return addDays(now, mastery >= 0.85 ? 30 : 14);
}

