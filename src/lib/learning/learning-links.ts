import type { JapaneseLevel } from "@/generated/prisma/client";
import { japaneseLevelValues } from "@/lib/validations/auth";
import {
  practiceModeValues,
  practiceQuestionCountValues,
  practiceSkillValues,
} from "@/lib/validations/practice";
import type { PracticeSkill } from "@/types/learning";

export type PracticeMode = (typeof practiceModeValues)[number];
export type PracticeQuestionCount = (typeof practiceQuestionCountValues)[number];

const SAFE_CONTENT_SLUG = /^[a-z0-9-]+$/i;

export type PracticeSessionAction = {
  type: "PRACTICE_SESSION";
  level: JapaneseLevel;
  skill: PracticeSkill;
  mode: PracticeMode;
  count?: PracticeQuestionCount;
};

export type ContentAction =
  | { type: "LESSON"; slug: string }
  | { type: "READING"; slug: string }
  | { type: "LISTENING"; slug: string }
  | { type: "MOCK_EXAM"; slug: string };

export type CatalogAction =
  | { type: "LEARN" }
  | { type: "PRACTICE_SETUP" }
  | { type: "READING_CATALOG" }
  | { type: "LISTENING_CATALOG" }
  | { type: "EXAMS_CATALOG" }
  | { type: "PROGRESS" }
  | { type: "REVIEW_HUB" };

export type LearningAction = PracticeSessionAction | ContentAction | CatalogAction;

export type LearningLinkContext = {
  level?: JapaneseLevel;
  targetSkill?: string;
  count?: PracticeQuestionCount;
};

function isValidLevel(level: string): level is JapaneseLevel {
  return (japaneseLevelValues as readonly string[]).includes(level);
}

function isValidSkill(skill: string): skill is PracticeSkill {
  return (practiceSkillValues as readonly string[]).includes(skill);
}

/** Map a recommendation target skill string to a practice skill enum. */
export function parsePracticeSkill(value?: string): PracticeSkill | null {
  if (!value) {
    return null;
  }
  const normalized = value.trim().toUpperCase();
  return isValidSkill(normalized) ? normalized : null;
}

/** Validate and encode a content slug for internal routes. */
export function sanitizeContentSlug(slug?: string): string | null {
  if (!slug || !SAFE_CONTENT_SLUG.test(slug)) {
    return null;
  }
  return slug;
}

/** Build the canonical practice-session href used by `/app/practice/session`. */
export function buildPracticeSessionHref(input: {
  level: JapaneseLevel;
  skill: PracticeSkill;
  mode: PracticeMode;
  count?: PracticeQuestionCount;
}): string {
  const params = new URLSearchParams();
  params.set("level", input.level);
  params.set("skill", input.skill);
  params.set("mode", input.mode);
  params.set("count", String(input.count ?? 10));
  return `/app/practice/session?${params.toString()}`;
}

function buildContentPath(
  kind: "LESSON" | "READING" | "LISTENING" | "MOCK_EXAM",
  slug: string,
): string | null {
  const safeSlug = sanitizeContentSlug(slug);
  if (!safeSlug) {
    return null;
  }

  const encoded = encodeURIComponent(safeSlug);
  switch (kind) {
    case "LESSON":
      return `/app/learn/${encoded}`;
    case "READING":
      return `/app/learn/reading/${encoded}`;
    case "LISTENING":
      return `/app/learn/listening/${encoded}`;
    case "MOCK_EXAM":
      return `/app/exams/${encoded}`;
  }
}

/** Build an internal application href from a validated learning action. */
export function buildLearningActionHref(action: LearningAction): string | null {
  switch (action.type) {
    case "PRACTICE_SESSION":
      if (!isValidLevel(action.level) || !isValidSkill(action.skill)) {
        return null;
      }
      return buildPracticeSessionHref(action);
    case "LESSON":
      return buildContentPath("LESSON", action.slug);
    case "READING":
      return buildContentPath("READING", action.slug);
    case "LISTENING":
      return buildContentPath("LISTENING", action.slug);
    case "MOCK_EXAM":
      return buildContentPath("MOCK_EXAM", action.slug);
    case "LEARN":
      return "/app/learn";
    case "PRACTICE_SETUP":
      return "/app/practice";
    case "READING_CATALOG":
      return "/app/learn/reading";
    case "LISTENING_CATALOG":
      return "/app/learn/listening";
    case "EXAMS_CATALOG":
      return "/app/exams";
    case "PROGRESS":
      return "/app/progress";
    case "REVIEW_HUB":
      return "/app/review";
    default:
      return null;
  }
}

/** Resolve a practice level from optional context; returns null when absent/invalid. */
export function resolvePracticeLevel(context?: LearningLinkContext): JapaneseLevel | null {
  if (!context?.level || !isValidLevel(context.level)) {
    return null;
  }
  return context.level;
}
