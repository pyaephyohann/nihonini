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
  OPEN_MOCK_EXAM: "/app/exams",
} as const;

export type TutorSuggestedActionRouteKey = keyof typeof tutorSuggestedActionRoutes;

export function getSuggestedActionHref(type: string): string | null {
  if (!(type in tutorSuggestedActionRoutes)) {
    return null;
  }
  return tutorSuggestedActionRoutes[type as TutorSuggestedActionRouteKey];
}

const SAFE_CONTENT_ID = /^[a-z0-9-]+$/i;

/** Build a safe internal href for a grounded recommendation item. */
export function getRecommendationHref(
  type: string,
  contentId?: string,
): string | null {
  if (contentId && !SAFE_CONTENT_ID.test(contentId)) {
    return null;
  }

  switch (type) {
    case "LESSON":
      return contentId ? `/app/learn/${contentId}` : getSuggestedActionHref("OPEN_LESSON");
    case "READING":
      return contentId ? `/app/learn/reading/${contentId}` : getSuggestedActionHref("OPEN_READING");
    case "LISTENING":
      return contentId
        ? `/app/learn/listening/${contentId}`
        : getSuggestedActionHref("OPEN_LISTENING");
    case "MOCK_EXAM":
      return contentId ? `/app/exams/${contentId}` : getSuggestedActionHref("OPEN_MOCK_EXAM");
    case "PRACTICE":
    case "REVIEW":
      return getSuggestedActionHref("OPEN_PRACTICE");
    case "TUTOR_PRACTICE":
      return getSuggestedActionHref("OPEN_PRACTICE");
    default:
      return null;
  }
}
