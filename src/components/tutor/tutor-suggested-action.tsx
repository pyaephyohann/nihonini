"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSuggestedActionHref } from "@/lib/tutor/suggested-actions";
import type { TutorSuggestedActionType } from "@/lib/validations/tutor";

type TutorSuggestedActionProps = {
  action: {
    type: TutorSuggestedActionType;
    label: string;
  };
};

export function TutorSuggestedAction({ action }: TutorSuggestedActionProps) {
  const href = getSuggestedActionHref(action.type);
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
