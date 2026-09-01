"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { startMockExamSessionAction } from "@/server/learning/mock-exam.actions";

type StartMockExamButtonProps = {
  mockExamId: string;
  activeSessionId?: string | null;
  label?: string;
};

export function StartMockExamButton({
  mockExamId,
  activeSessionId,
  label = "Start exam",
}: StartMockExamButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (activeSessionId) {
    return (
      <Button
        type="button"
        onClick={() => router.push(`/app/exams/session/${activeSessionId}`)}
      >
        Continue exam
      </Button>
    );
  }

  const handleStart = () => {
    startTransition(async () => {
      const result = await startMockExamSessionAction({ mockExamId });
      if ("error" in result) {
        alert(result.error);
        return;
      }
      router.push(`/app/exams/session/${result.sessionId}`);
    });
  };

  return (
    <Button type="button" onClick={handleStart} disabled={isPending}>
      {isPending ? "Starting..." : label}
    </Button>
  );
}
