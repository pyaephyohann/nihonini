import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/server/auth/require-auth";
import { getUserLearningAnalytics } from "@/server/learning/analytics.service";
import { ProgressAnalyticsView } from "@/components/analytics/progress-analytics-view";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Progress",
};

export default async function ProgressPage() {
  const session = await requireAuth();
  const analytics = await getUserLearningAnalytics(session.user.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-2xl">
        <Link href="/app">
          <Button variant="ghost" size="sm">
            ← Back to dashboard
          </Button>
        </Link>
        <p className="mt-4 font-display text-xl text-muted-foreground">学習の記録</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          Learning progress
        </h1>
        <p className="mt-3 text-muted-foreground">
          Skill mastery, practice performance, and your JLPT journey — derived from
          your actual learning activity.
        </p>
      </div>

      <ProgressAnalyticsView analytics={analytics} />
    </div>
  );
}
