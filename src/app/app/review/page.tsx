import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/server/auth/require-auth";
import { getDueReviewSummary } from "@/server/learning/daily-learning.service";
import { getPracticeDefaults } from "@/server/learning/practice-session.service";
import { ReviewHub } from "@/components/review/review-hub";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Review",
};

export default async function ReviewPage() {
  const session = await requireAuth();
  const [dueReviews, defaults] = await Promise.all([
    getDueReviewSummary(session.user.id),
    getPracticeDefaults(session.user.id),
  ]);

  return (
    <div className="mx-auto min-w-0 max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/app">
          <Button variant="ghost" size="sm">
            ← Back to dashboard
          </Button>
        </Link>
      </div>

      <ReviewHub dueReviews={dueReviews} level={defaults.level} />
    </div>
  );
}
