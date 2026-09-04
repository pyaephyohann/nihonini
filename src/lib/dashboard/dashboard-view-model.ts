import type { JapaneseLevel } from "@/generated/prisma/client";
import {
  buildLearningActionHref,
  buildPracticeSessionHref,
} from "@/lib/learning/learning-links";
import {
  buildReviewSessionHref,
  pickPrimaryReviewSkill,
} from "@/lib/learning/review-session";
import type {
  DashboardSnapshot,
  DueReviewSummary,
  PracticeSkill,
  SkillInsight,
} from "@/types/learning";

export type DashboardActionSource =
  | "REVIEW"
  | "WEAKNESS"
  | "CONTINUE"
  | "FALLBACK";

export type DashboardNextAction = {
  title: string;
  /** Concise explanation of why this action is recommended. */
  context: string;
  /** Optional supporting detail from authoritative signals. */
  description?: string;
  href: string;
  source: DashboardActionSource;
  skill?: PracticeSkill;
  level?: JapaneseLevel;
};

export type DashboardViewModel = {
  snapshot: DashboardSnapshot;
  nextAction: DashboardNextAction;
};

export type ResolveDashboardNextActionInput = {
  learnerLevel: JapaneseLevel;
  dueReviews: DueReviewSummary;
  weaknesses: SkillInsight[];
  continueLearning: DashboardSnapshot["continueLearning"];
};

const FALLBACK_ACTION: DashboardNextAction = {
  title: "Start learning",
  context: "Start building your Japanese foundation.",
  href: "/app/learn",
  source: "FALLBACK",
};

function skillLabel(skill: PracticeSkill): string {
  return skill.charAt(0) + skill.slice(1).toLowerCase();
}

/** Build a safe internal href for the dashboard continue-learning destination. */
export function buildContinueLearningHref(
  continueLearning: DashboardSnapshot["continueLearning"],
): string {
  if (continueLearning.lessonSlug) {
    return (
      buildLearningActionHref({ type: "LESSON", slug: continueLearning.lessonSlug }) ??
      buildLearningActionHref({ type: "LEARN" }) ??
      FALLBACK_ACTION.href
    );
  }

  return buildLearningActionHref({ type: "LEARN" }) ?? FALLBACK_ACTION.href;
}

/** Deterministic next-best-action resolution from authoritative dashboard signals. */
export function resolveDashboardNextAction(
  input: ResolveDashboardNextActionInput,
): DashboardNextAction {
  const { learnerLevel, dueReviews, weaknesses, continueLearning } = input;

  const primaryReviewSkill = pickPrimaryReviewSkill(dueReviews);
  if (dueReviews.total > 0 && primaryReviewSkill) {
    const skillName = skillLabel(primaryReviewSkill);
    return {
      title: "Review due items",
      context: `You have ${dueReviews.total} item${dueReviews.total === 1 ? "" : "s"} ready for review.`,
      description: `${skillName} has the most due items right now.`,
      href: buildReviewSessionHref({
        level: learnerLevel,
        skill: primaryReviewSkill,
        count: 10,
      }),
      source: "REVIEW",
      skill: primaryReviewSkill,
      level: learnerLevel,
    };
  }

  const primaryWeakness = weaknesses[0];
  if (primaryWeakness) {
    const skillName = skillLabel(primaryWeakness.skill);
    return {
      title: `Practice ${skillName.toLowerCase()}`,
      context: `${skillName} is currently one of your weakest areas.`,
      description: `${primaryWeakness.masteryPercent}% mastery at ${primaryWeakness.level}.`,
      href: buildPracticeSessionHref({
        level: primaryWeakness.level,
        skill: primaryWeakness.skill,
        mode: "WEAKNESS",
        count: 10,
      }),
      source: "WEAKNESS",
      skill: primaryWeakness.skill,
      level: primaryWeakness.level,
    };
  }

  if (continueLearning.lessonSlug) {
    const inProgress = continueLearning.progressPercent > 0;
    const lessonTitle = continueLearning.lessonTitle ?? "your next lesson";
    return {
      title: inProgress ? "Continue lesson" : "Start next lesson",
      context: inProgress
        ? `Continue with your in-progress lesson in ${lessonTitle}.`
        : `Continue with your next lesson in ${lessonTitle}.`,
      href: buildContinueLearningHref(continueLearning),
      source: "CONTINUE",
      level: learnerLevel,
    };
  }

  return { ...FALLBACK_ACTION, level: learnerLevel };
}
