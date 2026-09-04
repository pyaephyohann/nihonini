"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { LearningLinkContext } from "@/lib/learning/learning-links";
import { getSuggestedActionHref } from "@/lib/tutor/suggested-actions";
import type { TutorSuggestedActionType } from "@/lib/validations/tutor";

type TutorSuggestedActionProps = {
  action: {
    type: TutorSuggestedActionType;
    label: string;
  };
  linkContext?: LearningLinkContext;
};

export function TutorSuggestedAction({ action, linkContext }: TutorSuggestedActionProps) {
  const href = getSuggestedActionHref(action.type, linkContext);
  if (!href) {
    return null;
  }

  return (
    <Link href={href}>
      <Button type="button" variant="secondary" size="sm">
        {action.label}
      </Button>
    </Link>
  );
}
