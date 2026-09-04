import type { JapaneseLevel } from "@/generated/prisma/client";
import { buildPracticeSessionHref } from "@/lib/learning/learning-links";
import type { DueReviewSummary, PracticeSkill } from "@/types/learning";

const SKILL_ORDER: PracticeSkill[] = ["VOCABULARY", "GRAMMAR", "KANJI"];

/** Pick the skill with the most due items; ties break by vocabulary → grammar → kanji. */
export function pickPrimaryReviewSkill(summary: DueReviewSummary): PracticeSkill | null {
  if (summary.total === 0) {
    return null;
  }

  let bestSkill: PracticeSkill = "VOCABULARY";
  let bestCount = -1;

  for (const skill of SKILL_ORDER) {
    const count =
      skill === "VOCABULARY"
        ? summary.vocabulary
        : skill === "GRAMMAR"
          ? summary.grammar
          : summary.kanji;

    if (count > bestCount) {
      bestCount = count;
      bestSkill = skill;
    }
  }

  return bestCount > 0 ? bestSkill : null;
}

/** Build href for the existing REVIEW practice session route. */
export function buildReviewSessionHref(input: {
  level: JapaneseLevel;
  skill: PracticeSkill;
  count?: 5 | 10 | 20;
}): string {
  return buildPracticeSessionHref({
    level: input.level,
    skill: input.skill,
    mode: "REVIEW",
    count: input.count ?? 10,
  });
}
