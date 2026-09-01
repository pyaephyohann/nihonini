export const tutorSuggestedActionRoutes = {
  PRACTICE_WEAK_VOCABULARY: "/app/practice",
  PRACTICE_WEAK_GRAMMAR: "/app/practice",
  PRACTICE_WEAK_KANJI: "/app/practice",
  PRACTICE_WEAK_SKILL: "/app/practice",
  CONTINUE_LEARNING: "/app/learn",
  OPEN_LESSON: "/app/learn",
  OPEN_VOCABULARY: "/app/practice",
  OPEN_GRAMMAR: "/app/practice",
  OPEN_KANJI: "/app/practice",
  OPEN_READING: "/app/learn/reading",
  OPEN_LISTENING: "/app/learn/listening",
  OPEN_PRACTICE: "/app/practice",
  VIEW_PROGRESS: "/app/progress",
} as const;

export type TutorSuggestedActionRouteKey = keyof typeof tutorSuggestedActionRoutes;

export function getSuggestedActionHref(type: string): string | null {
  if (!(type in tutorSuggestedActionRoutes)) {
    return null;
  }
  return tutorSuggestedActionRoutes[type as TutorSuggestedActionRouteKey];
}
