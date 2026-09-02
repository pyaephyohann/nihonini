import "server-only";

import type {
  TutorOutcomeContext,
  TutorProgressContext,
} from "@/server/tutor/outcome/tutor-outcome.types";
import type { TutorAdaptiveCoachingContext } from "@/server/tutor/coaching/tutor-coaching.types";

export function determineCoachingPolicy(input: {
  outcomeContext?: TutorOutcomeContext;
  progressContext?: TutorProgressContext;
}): TutorAdaptiveCoachingContext | null {
  const { outcomeContext, progressContext } = input;

  if (!outcomeContext) {
    // No outcome context. We can still apply some generic coaching based on progress,
    // but the task primarily focuses on recommendation -> outcome adaptation.
    // If progress is very weak, maybe we suggest PRACTICE. Otherwise NEUTRAL.
    if (progressContext) {
      if (
        (progressContext.recentAccuracy.value !== null &&
          progressContext.recentAccuracy.value < 60) ||
        progressContext.weakSkills.length > 0
      ) {
        return {
          mode: "ADAPTIVE_COACHING",
          directive: "PRACTICE",
          confidence: "NONE",
          focusSkill: progressContext.weakSkills[0]?.skill,
          recommendedBehavior:
            "Provide targeted Tutor practice for the weak skill.",
          tutorPracticeDifficulty: "EASY",
        };
      }
    }
    return null; // NEUTRAL / no adaptation needed
  }

  const { outcome, confidence } = outcomeContext;
  const focusSkill = outcome?.targetSkill;
  
  if (confidence === "AMBIGUOUS") {
    return {
      mode: "ADAPTIVE_COACHING",
      directive: "CLARIFY",
      confidence,
      recommendedBehavior:
        "Ask a concise clarifying question to confirm which activity the learner completed. Do not guess.",
    };
  }

  if (confidence === "NONE" || !outcome) {
    return {
      mode: "ADAPTIVE_COACHING",
      directive: "NEUTRAL",
      confidence,
      recommendedBehavior:
        "No verified completion or outcome found. Do not fabricate completion.",
    };
  }

  // Determine positive vs negative outcome
  let isPositive = false;
  let isNegative = false;

  if (outcome.scorePercent !== undefined) {
    if (outcome.scorePercent >= 75) {
      isPositive = true;
    } else {
      isNegative = true;
    }
  } else if (outcome.isCompleted) {
    // Completed without a score (e.g. a lesson or reading without quiz)
    isPositive = true;
  }

  // Determine persistent strength / weakness from progressContext
  const hasPersistentWeakness = progressContext
    ? (focusSkill && progressContext.weakSkills.some((ws) => ws.skill === focusSkill)) ||
      (progressContext.recentAccuracy.value !== null && progressContext.recentAccuracy.value < 65)
    : false;

  const hasPersistentStrength = progressContext
    ? progressContext.recentAccuracy.value !== null && progressContext.recentAccuracy.value > 85
    : false;

  if (confidence === "HIGH") {
    if (isPositive) {
      if (hasPersistentStrength) {
        return {
          mode: "ADAPTIVE_COACHING",
          directive: "CHALLENGE",
          confidence,
          focusSkill,
          recommendedBehavior:
            "Acknowledge strong performance and provide a more challenging example or Tutor practice.",
          tutorPracticeDifficulty: "HARD",
        };
      } else {
        return {
          mode: "ADAPTIVE_COACHING",
          directive: "REINFORCE",
          confidence,
          focusSkill,
          recommendedBehavior:
            "Acknowledge success, explain why they did well if appropriate, and encourage continued progression.",
          tutorPracticeDifficulty: "MEDIUM",
        };
      }
    } else if (isNegative) {
      if (hasPersistentWeakness) {
        return {
          mode: "ADAPTIVE_COACHING",
          directive: "ESCALATE",
          confidence,
          focusSkill,
          recommendedBehavior:
            "Acknowledge the persistent difficulty. Provide a clear explanation of the mistake, then escalate to targeted Tutor practice.",
          tutorPracticeDifficulty: "EASY",
        };
      } else {
        return {
          mode: "ADAPTIVE_COACHING",
          directive: "REMEDIATE",
          confidence,
          focusSkill,
          recommendedBehavior:
            "Explain the mistake carefully. Avoid overreacting to an isolated error.",
          tutorPracticeDifficulty: "MEDIUM",
        };
      }
    }
  }

  if (confidence === "MEDIUM") {
    if (isNegative) {
      return {
        mode: "ADAPTIVE_COACHING",
        directive: "REMEDIATE",
        confidence,
        focusSkill,
        recommendedBehavior:
          "Provide a cautious explanation of the potential mistake. Do not present the outcome as certain fact.",
        tutorPracticeDifficulty: "EASY",
      };
    }
    return {
      mode: "ADAPTIVE_COACHING",
      directive: "NEUTRAL",
      confidence,
      focusSkill,
      recommendedBehavior:
        "Acknowledge the likely activity completion cautiously. Do not present uncertain matching as fact.",
    };
  }

  return {
    mode: "ADAPTIVE_COACHING",
    directive: "NEUTRAL",
    confidence,
    recommendedBehavior: "Proceed normally without strong adaptation.",
  };
}
