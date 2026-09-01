import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { PracticeMode, PracticeSkill } from "@/types/learning";

type PracticeSummaryProps = {
  level: string;
  skill: PracticeSkill;
  mode: PracticeMode;
  total: number;
  correct: number;
  reviewsScheduled: number;
  backHref?: string;
};

export function PracticeSummary({
  level,
  skill,
  mode,
  total,
  correct,
  reviewsScheduled,
  backHref = "/app/learn",
}: PracticeSummaryProps) {
  const incorrect = Math.max(0, total - correct);
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-foreground">Practice complete 🎉</h2>
      <p className="mt-2 text-muted-foreground">
        {level} {skill.toLowerCase()} · {mode.toLowerCase()}
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">Score</p>
          <p className="mt-1 text-xl font-semibold text-foreground">
            {correct} / {total}
          </p>
          <p className="text-sm text-muted-foreground">{accuracy}% accuracy</p>
        </div>

        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">Session impact</p>
          <p className="mt-1 text-sm text-foreground">
            Correct: {correct} · Incorrect: {incorrect}
          </p>
          <p className="text-sm text-muted-foreground">
            Reviews scheduled: {reviewsScheduled}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href={backHref}>
          <Button variant="secondary">Back to learn</Button>
        </Link>
        <Link
          href={`/app/practice/session?level=${level}&skill=${skill}&mode=${mode}&count=${total}`}
        >
          <Button>Practice again</Button>
        </Link>
      </div>
    </div>
  );
}

