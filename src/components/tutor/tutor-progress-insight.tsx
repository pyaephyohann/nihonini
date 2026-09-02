"use client";

import type { TutorProgressContext } from "@/server/tutor/outcome/tutor-outcome.types";
import { CheckCircle2, TrendingUp, TrendingDown, Minus, Target } from "lucide-react";

export function TutorProgressInsight({ progress }: { progress: TutorProgressContext }) {
  const { jlpt, weakSkills, recentAccuracy, dueReviews } = progress;
  const showAccuracy = recentAccuracy.value !== null && recentAccuracy.sampleSize > 0;
  
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-primary" />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">
          Learning Progress
        </h4>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">JLPT Goal</p>
          <p className="font-medium text-foreground">
            {jlpt.target} <span className="text-xs text-muted-foreground">({jlpt.targetProgressPercent}% path)</span>
          </p>
        </div>

        {dueReviews.total > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Due Reviews</p>
            <p className="font-medium text-foreground">{dueReviews.total} items</p>
          </div>
        )}

        {showAccuracy && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Recent Accuracy</p>
            <div className="flex items-center gap-1 font-medium text-foreground">
              {recentAccuracy.value}%
              {recentAccuracy.trend === "up" && <TrendingUp className="h-3 w-3 text-green-500" />}
              {recentAccuracy.trend === "down" && <TrendingDown className="h-3 w-3 text-amber-500" />}
              {recentAccuracy.trend === "flat" && <Minus className="h-3 w-3 text-muted-foreground" />}
            </div>
          </div>
        )}

        {weakSkills.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Focus Area</p>
            <p className="font-medium capitalize text-foreground">{weakSkills[0]?.skill.toLowerCase()}</p>
          </div>
        )}
      </div>
      
      {progress.recentHighlights.length > 0 && (
        <div className="pt-2 border-t border-primary/10">
          <p className="text-xs text-muted-foreground mb-1">Recent Activity</p>
          <ul className="space-y-1">
            {progress.recentHighlights.slice(0, 2).map((highlight, index) => (
              <li key={index} className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                <span className="text-foreground">
                  <span className="font-medium">{highlight.type === "LESSON" ? "Lesson: " : ""}</span>
                  {highlight.title}
                  {highlight.scorePercent !== undefined && ` (${highlight.scorePercent}%)`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
