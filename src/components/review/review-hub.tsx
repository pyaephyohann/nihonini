import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  buildReviewSessionHref,
  pickPrimaryReviewSkill,
} from "@/lib/learning/review-session";
import type { JapaneseLevel } from "@/generated/prisma/client";
import type { DueReviewSummary, PracticeSkill } from "@/types/learning";

type ReviewHubProps = {
  dueReviews: DueReviewSummary;
  level: JapaneseLevel;
};

type SkillRow = {
  label: string;
  count: number;
  skill: PracticeSkill | null;
};

const SKILL_ROWS: SkillRow[] = [
  { label: "Vocabulary", count: 0, skill: "VOCABULARY" },
  { label: "Grammar", count: 0, skill: "GRAMMAR" },
  { label: "Kanji", count: 0, skill: "KANJI" },
  { label: "Reading", count: 0, skill: null },
  { label: "Listening", count: 0, skill: null },
];

function withCounts(summary: DueReviewSummary): SkillRow[] {
  return SKILL_ROWS.map((row) => {
    if (row.skill === "VOCABULARY") {
      return { ...row, count: summary.vocabulary };
    }
    if (row.skill === "GRAMMAR") {
      return { ...row, count: summary.grammar };
    }
    if (row.skill === "KANJI") {
      return { ...row, count: summary.kanji };
    }
    return row;
  });
}

export function ReviewHub({ dueReviews, level }: ReviewHubProps) {
  const primarySkill = pickPrimaryReviewSkill(dueReviews);
  const startHref =
    primarySkill !== null
      ? buildReviewSessionHref({ level, skill: primarySkill, count: 10 })
      : null;
  const skillRows = withCounts(dueReviews);

  if (dueReviews.total === 0) {
    return (
      <div className="min-w-0 space-y-8">
        <header className="max-w-2xl">
          <p className="font-display text-xl text-muted-foreground">復習</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Review</h1>
          <p className="mt-3 text-muted-foreground">
            Keep your memory fresh. Review items when spaced repetition says they are
            ready to come back.
          </p>
        </header>

        <Card className="mx-auto max-w-lg p-8 text-center">
          <p className="text-4xl" aria-hidden="true">
            🎉
          </p>
          <h2 className="mt-4 text-2xl font-bold text-foreground">You&apos;re all caught up</h2>
          <p className="mt-3 text-muted-foreground">
            There are no items due for spaced review right now. Keep learning and
            we&apos;ll surface them here when they are ready to come back.
          </p>
          <div className="mt-6">
            <Link href="/app/learn">
              <Button>Continue learning</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-8">
      <header className="max-w-2xl">
        <p className="font-display text-xl text-muted-foreground">復習</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Review</h1>
        <p className="mt-3 text-muted-foreground">
          Keep your memory fresh. Review the things that are ready to come back.
        </p>
      </header>

      <Card className="mx-auto max-w-lg p-8 text-center">
        <h2 className="text-lg font-semibold text-foreground">Ready to review</h2>
        <p className="mt-4 text-5xl font-bold tabular-nums text-foreground">
          {dueReviews.total}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          item{dueReviews.total === 1 ? "" : "s"} due
        </p>
        {startHref && (
          <div className="mt-6">
            <Link href={startHref}>
              <Button size="lg">Start review</Button>
            </Link>
          </div>
        )}
      </Card>

      <section aria-labelledby="skill-breakdown-heading" className="max-w-lg">
        <h2 id="skill-breakdown-heading" className="text-lg font-semibold text-foreground">
          By skill
        </h2>
        <ul className="mt-4 space-y-2">
          {skillRows.map((row) => (
            <li key={row.label}>
              <Card className="flex min-w-0 items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{row.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {row.count} due
                    {row.skill === null && row.count === 0 ? " · not in review queue" : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-2xl font-bold tabular-nums text-foreground">
                    {row.count}
                  </span>
                  {row.skill && row.count > 0 && (
                    <Link
                      href={buildReviewSessionHref({
                        level,
                        skill: row.skill,
                        count: 10,
                      })}
                      className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      <Button size="sm" variant="secondary">
                        Review
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
