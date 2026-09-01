import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/server/auth/require-auth";
import { getDueReviewSummary } from "@/server/learning/daily-learning.service";
import { getUserLessonsCatalog } from "@/server/learning/lesson.service";
import { LessonList } from "@/components/learning/lesson-list";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Learn",
};

export default async function LearnPage() {
  const session = await requireAuth();
  const [levels, dueReviews] = await Promise.all([
    getUserLessonsCatalog(session.user.id),
    getDueReviewSummary(session.user.id),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <p className="font-display text-xl text-muted-foreground">
          学びましょう
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          Japanese lessons
        </h1>
        <p className="mt-3 text-muted-foreground">
          Explore demo JLPT-aligned lessons. Content is database-driven and will
          expand over time — this is not an official JLPT curriculum.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Due reviews: {dueReviews.total} (Vocab {dueReviews.vocabulary}, Grammar{" "}
          {dueReviews.grammar}, Kanji {dueReviews.kanji})
        </p>
      </div>

      <div className="mt-4">
        <Link href="/app">
          <Button variant="ghost" size="sm">
            ← Back to dashboard
          </Button>
        </Link>
      </div>

      <div className="mt-10">
        <LessonList levels={levels} />
      </div>
    </div>
  );
}
