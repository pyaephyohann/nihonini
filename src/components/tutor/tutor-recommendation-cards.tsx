"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getRecommendationHref,
  getSuggestedActionHref,
} from "@/lib/tutor/suggested-actions";
import type { TutorRecommendationActivityType } from "@/lib/validations/tutor";

export type TutorRecommendationItem = {
  id: string;
  type: TutorRecommendationActivityType;
  title: string;
  reason: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  estimatedMinutes: number;
  targetSkill?: string;
  contentId?: string;
  suggestedAction?: {
    type: string;
    label: string;
  };
};

type TutorRecommendationCardsProps = {
  recommendations: TutorRecommendationItem[];
};

function resolveActionHref(item: TutorRecommendationItem): string | null {
  const contentHref = getRecommendationHref(item.type, item.contentId);
  if (contentHref) {
    return contentHref;
  }
  if (item.suggestedAction?.type) {
    return getSuggestedActionHref(item.suggestedAction.type);
  }
  return null;
}

export function TutorRecommendationCards({ recommendations }: TutorRecommendationCardsProps) {
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Your next best steps
      </p>
      {recommendations.map((item) => {
        const href = resolveActionHref(item);
        const actionLabel = item.suggestedAction?.label ?? "Start";

        return (
          <div
            key={item.id}
            className="rounded-lg border border-border/60 bg-background/60 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                  {item.reason}
                </p>
                {item.targetSkill && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Focus: {item.targetSkill.replaceAll("_", " ")}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3.5" aria-hidden="true" />
                <span>{item.estimatedMinutes} min</span>
              </div>
            </div>
            {href && (
              <Link href={href} className="mt-3 inline-block">
                <Button type="button" variant="secondary" size="sm">
                  {actionLabel}
                </Button>
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
