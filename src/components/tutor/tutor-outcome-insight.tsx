"use client";

import type { TutorOutcomeContext } from "@/server/tutor/outcome/tutor-outcome.types";
import { CheckCircle2, HelpCircle } from "lucide-react";

export function TutorOutcomeInsight({ outcomeContext }: { outcomeContext: TutorOutcomeContext }) {
  if (outcomeContext.confidence === "NONE" || outcomeContext.confidence === "AMBIGUOUS" || !outcomeContext.outcome) {
    return null;
  }

  const { outcome, confidence } = outcomeContext;
  
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
      <div className="flex items-center gap-2">
        {confidence === "HIGH" ? (
          <CheckCircle2 className="h-4 w-4 text-primary" />
        ) : (
          <HelpCircle className="h-4 w-4 text-primary" />
        )}
        <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">
          {confidence === "HIGH" ? "Verified Recent Activity" : "Recent Activity"}
        </h4>
      </div>

      <div className="text-sm space-y-1">
        <p className="font-medium text-foreground flex items-center gap-1.5">
          <span className="capitalize">{outcome.type.replace("_", " ").toLowerCase()}</span>
          {outcome.title && (
            <>
              <span className="text-muted-foreground">·</span>
              <span>{outcome.title}</span>
            </>
          )}
        </p>

        {(outcome.scorePercent !== undefined || outcome.targetSkill) && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {outcome.scorePercent !== undefined && (
              <span className="font-medium text-foreground">Score: {outcome.scorePercent}%</span>
            )}
            {outcome.targetSkill && (
              <span className="capitalize">Skill: {outcome.targetSkill.toLowerCase()}</span>
            )}
            {outcome.isCompleted && outcome.scorePercent === undefined && (
              <span className="font-medium text-green-600 dark:text-green-500">Completed</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
