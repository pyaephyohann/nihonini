import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/server/auth/require-auth";
import { practiceSessionSearchParamsSchema } from "@/lib/validations/practice";
import { createPracticeSessionPlan } from "@/server/learning/practice-session.service";
import { Button } from "@/components/ui/button";
import { PracticeSession } from "@/components/practice/practice-session";

type PracticeSessionPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Practice session",
};

export default async function PracticeSessionPage({
  searchParams,
}: PracticeSessionPageProps) {
  const session = await requireAuth();
  const raw = await searchParams;

  const parsedParams = practiceSessionSearchParamsSchema.safeParse({
    level: Array.isArray(raw.level) ? raw.level[0] : raw.level,
    skill: Array.isArray(raw.skill) ? raw.skill[0] : raw.skill,
    mode: Array.isArray(raw.mode) ? raw.mode[0] : raw.mode,
    count: Array.isArray(raw.count) ? raw.count[0] : raw.count,
  });

  if (!parsedParams.success) {
    notFound();
  }

  const plan = await createPracticeSessionPlan({
    userId: session.user.id,
    config: {
      level: parsedParams.data.level,
      skill: parsedParams.data.skill,
      mode: parsedParams.data.mode,
      questionCount: Number(parsedParams.data.count),
    },
  });

  if ("error" in plan) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm text-error">{plan.error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/app/practice">
          <Button variant="ghost" size="sm">
            ← Back to practice setup
          </Button>
        </Link>
      </div>

      <header className="mb-6">
        <p className="text-sm text-muted-foreground">
          {plan.level} · {plan.skill} · {plan.mode}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">Practice session</h1>
        {plan.availableCount < plan.requestedCount && (
          <p className="mt-2 text-sm text-muted-foreground">
            {plan.availableCount} items available for this mode.
          </p>
        )}
      </header>

      {plan.exercises.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">No items available</h2>
          <p className="mt-2 text-muted-foreground">
            {plan.emptyStateMessage ?? "Try another level, skill, or mode."}
          </p>
          <div className="mt-4">
            <Link href="/app/practice">
              <Button>Back to practice</Button>
            </Link>
          </div>
        </div>
      ) : (
        <PracticeSession plan={plan} />
      )}
    </div>
  );
}

