"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type MockExamTimerProps = {
  expiresAt: string;
  serverNow: string;
};

function formatRemaining(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function MockExamTimer({ expiresAt, serverNow }: MockExamTimerProps) {
  const [offsetMs] = useState(() => Date.now() - new Date(serverNow).getTime());
  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    const expires = new Date(expiresAt).getTime();
    return Math.max(0, Math.floor((expires - Date.now()) / 1000));
  });

  useEffect(() => {
    const tick = () => {
      const now = Date.now() + offsetMs;
      const expires = new Date(expiresAt).getTime();
      setRemainingSeconds(Math.max(0, Math.floor((expires - now) / 1000)));
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [expiresAt, offsetMs]);

  const warningLevel =
    remainingSeconds <= 60 ? "critical" : remainingSeconds <= 300 ? "warning" : "normal";

  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3",
        warningLevel === "critical" && "border-error bg-error/10",
        warningLevel === "warning" && "border-warning bg-warning/10",
        warningLevel === "normal" && "border-border bg-card",
      )}
      role="status"
      aria-live="polite"
    >
      <p className="text-sm font-medium text-muted-foreground">Time remaining</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
        {formatRemaining(remainingSeconds)}
      </p>
      {warningLevel === "warning" && (
        <p className="mt-1 text-sm text-foreground">5:00 remaining</p>
      )}
      {warningLevel === "critical" && (
        <p className="mt-1 text-sm font-medium text-foreground">1:00 remaining</p>
      )}
    </div>
  );
}
