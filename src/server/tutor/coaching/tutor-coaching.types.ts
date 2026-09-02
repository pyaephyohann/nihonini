import "server-only";

import type { OutcomeConfidence } from "@/server/tutor/outcome/tutor-outcome.types";

export type TutorCoachingDirective =
  | "REINFORCE"
  | "REMEDIATE"
  | "PRACTICE"
  | "ESCALATE"
  | "CHALLENGE"
  | "CLARIFY"
  | "NEUTRAL";

export type TutorAdaptiveCoachingContext = {
  mode: "ADAPTIVE_COACHING";
  directive: TutorCoachingDirective;
  confidence: OutcomeConfidence;
  focusSkill?: string;
  recommendedBehavior: string;
  tutorPracticeDifficulty?: "EASY" | "MEDIUM" | "HARD";
};
