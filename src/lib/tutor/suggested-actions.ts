import type { JapaneseLevel } from "@/generated/prisma/client";
import type { TutorSuggestedActionType } from "@/lib/validations/tutor";
import {
  buildLearningActionHref,
  buildPracticeSessionHref,
  parsePracticeSkill,
  resolvePracticeLevel,
  sanitizeContentSlug,
  type LearningLinkContext,
} from "@/lib/learning/learning-links";
import type { PracticeSkill } from "@/types/learning";

export type TutorSuggestedActionRouteKey =
  | "PRACTICE_WEAK_VOCABULARY"
  | "PRACTICE_WEAK_GRAMMAR"
  | "PRACTICE_WEAK_KANJI"
  | "PRACTICE_WEAK_SKILL"
  | "CONTINUE_LEARNING"
  | "OPEN_LESSON"
  | "OPEN_VOCABULARY"
  | "OPEN_GRAMMAR"
  | "OPEN_KANJI"
  | "OPEN_READING"
  | "OPEN_LISTENING"
  | "OPEN_PRACTICE"
  | "VIEW_PROGRESS"
  | "OPEN_MOCK_EXAM";

const CATALOG_ROUTES: Record<
  Exclude<
    TutorSuggestedActionRouteKey,
    | "PRACTICE_WEAK_VOCABULARY"
    | "PRACTICE_WEAK_GRAMMAR"
    | "PRACTICE_WEAK_KANJI"
    | "PRACTICE_WEAK_SKILL"
    | "OPEN_VOCABULARY"
    | "OPEN_GRAMMAR"
    | "OPEN_KANJI"
  >,
  ReturnType<typeof buildLearningActionHref>
> = {
  CONTINUE_LEARNING: buildLearningActionHref({ type: "LEARN" }),
  OPEN_LESSON: buildLearningActionHref({ type: "LEARN" }),
  OPEN_READING: buildLearningActionHref({ type: "READING_CATALOG" }),
  OPEN_LISTENING: buildLearningActionHref({ type: "LISTENING_CATALOG" }),
  OPEN_PRACTICE: buildLearningActionHref({ type: "PRACTICE_SETUP" }),
  VIEW_PROGRESS: buildLearningActionHref({ type: "PROGRESS" }),
  OPEN_MOCK_EXAM: buildLearningActionHref({ type: "EXAMS_CATALOG" }),
};

function practiceSessionFromSkill(
  level: JapaneseLevel,
  skill: PracticeSkill,
  mode: "REVIEW" | "WEAKNESS" | "LEVEL",
  count?: 5 | 10 | 20,
): string {
  return buildPracticeSessionHref({ level, skill, mode, count });
}

/** Build href for tutor suggested actions, preserving practice intent when level is known. */
export function getSuggestedActionHref(
  type: string,
  context?: LearningLinkContext,
): string | null {
  if (!(type in tutorSuggestedActionRoutes)) {
    return null;
  }

  const level = resolvePracticeLevel(context);
  const count = context?.count ?? 10;

  switch (type as TutorSuggestedActionType) {
    case "PRACTICE_WEAK_VOCABULARY":
      return level
        ? practiceSessionFromSkill(level, "VOCABULARY", "WEAKNESS", count)
        : CATALOG_ROUTES.OPEN_PRACTICE;
    case "PRACTICE_WEAK_GRAMMAR":
      return level
        ? practiceSessionFromSkill(level, "GRAMMAR", "WEAKNESS", count)
        : CATALOG_ROUTES.OPEN_PRACTICE;
    case "PRACTICE_WEAK_KANJI":
      return level
        ? practiceSessionFromSkill(level, "KANJI", "WEAKNESS", count)
        : CATALOG_ROUTES.OPEN_PRACTICE;
    case "PRACTICE_WEAK_SKILL": {
      const skill = parsePracticeSkill(context?.targetSkill) ?? "VOCABULARY";
      return level
        ? practiceSessionFromSkill(level, skill, "WEAKNESS", count)
        : CATALOG_ROUTES.OPEN_PRACTICE;
    }
    case "OPEN_VOCABULARY":
      return level
        ? practiceSessionFromSkill(level, "VOCABULARY", "LEVEL", count)
        : CATALOG_ROUTES.OPEN_PRACTICE;
    case "OPEN_GRAMMAR":
      return level
        ? practiceSessionFromSkill(level, "GRAMMAR", "LEVEL", count)
        : CATALOG_ROUTES.OPEN_PRACTICE;
    case "OPEN_KANJI":
      return level
        ? practiceSessionFromSkill(level, "KANJI", "LEVEL", count)
        : CATALOG_ROUTES.OPEN_PRACTICE;
    case "CONTINUE_LEARNING":
    case "OPEN_LESSON":
    case "OPEN_READING":
    case "OPEN_LISTENING":
    case "OPEN_PRACTICE":
    case "VIEW_PROGRESS":
    case "OPEN_MOCK_EXAM":
      return CATALOG_ROUTES[type as keyof typeof CATALOG_ROUTES] ?? null;
    default:
      return null;
  }
}

/** Build a safe internal href for a grounded tutor recommendation item. */
export function getRecommendationHref(
  type: string,
  contentId?: string,
  context?: LearningLinkContext,
): string | null {
  const level = resolvePracticeLevel(context);
  const count = context?.count ?? 10;
  const skill = parsePracticeSkill(context?.targetSkill);

  if (contentId && !sanitizeContentSlug(contentId)) {
    return null;
  }

  switch (type) {
    case "LESSON":
      return contentId
        ? buildLearningActionHref({ type: "LESSON", slug: contentId })
        : getSuggestedActionHref("OPEN_LESSON", context);
    case "READING":
      return contentId
        ? buildLearningActionHref({ type: "READING", slug: contentId })
        : getSuggestedActionHref("OPEN_READING", context);
    case "LISTENING":
      return contentId
        ? buildLearningActionHref({ type: "LISTENING", slug: contentId })
        : getSuggestedActionHref("OPEN_LISTENING", context);
    case "MOCK_EXAM":
      return contentId
        ? buildLearningActionHref({ type: "MOCK_EXAM", slug: contentId })
        : getSuggestedActionHref("OPEN_MOCK_EXAM", context);
    case "REVIEW":
      if (level && skill) {
        return practiceSessionFromSkill(level, skill, "REVIEW", count);
      }
      return buildLearningActionHref({ type: "REVIEW_HUB" });
    case "PRACTICE":
      if (level && skill) {
        return practiceSessionFromSkill(level, skill, "WEAKNESS", count);
      }
      return getSuggestedActionHref("OPEN_PRACTICE", context);
    case "TUTOR_PRACTICE":
      return getSuggestedActionHref("OPEN_PRACTICE", context);
    default:
      return null;
  }
}

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
