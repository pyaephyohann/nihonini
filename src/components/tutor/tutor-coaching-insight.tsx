"use client";

import type { TutorAdaptiveCoachingContext } from "@/server/tutor/coaching/tutor-coaching.types";
import { Lightbulb } from "lucide-react";

export function TutorCoachingInsight({ coaching }: { coaching: TutorAdaptiveCoachingContext }) {
  if (coaching.directive === "NEUTRAL" || coaching.directive === "CLARIFY") {
    return null;
  }

  let userFriendlyText = "";

  switch (coaching.directive) {
    case "REINFORCE":
      userFriendlyText = "Great work. You're making progress here.";
      break;
    case "REMEDIATE":
      userFriendlyText = "Let's strengthen this area.";
      break;
    case "PRACTICE":
      userFriendlyText = "Let's try a quick practice question.";
      break;
    case "ESCALATE":
      userFriendlyText = "Let's spend a little more time strengthening this skill.";
      break;
    case "CHALLENGE":
      userFriendlyText = "You're doing well. Let's try something a little harder.";
      break;
  }

  if (!userFriendlyText) return null;

  return (
    <div className="rounded-lg bg-secondary/30 p-2.5 flex items-center gap-2">
      <Lightbulb className="h-4 w-4 text-primary shrink-0" />
      <span className="text-sm font-medium text-foreground">{userFriendlyText}</span>
    </div>
  );
}
