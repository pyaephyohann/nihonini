import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/server/auth/require-auth";
import { findSafeUserById } from "@/server/users/user.repository";
import { getDueReviewSummary } from "@/server/learning/daily-learning.service";
import { getUserJlptCurriculum } from "@/server/learning/jlpt.service";
import { getUserLessonsCatalog } from "@/server/learning/lesson.service";
import { countPublishedReadingsByLevel } from "@/server/learning/reading.repository";
import { countPublishedListeningsByLevel } from "@/server/learning/listening.repository";
import { LessonList } from "@/components/learning/lesson-list";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Learn",
};

export default async function LearnPage() {
  const session = await requireAuth();
  const user = await findSafeUserById(session.user.id);
  const levels = await getUserLessonsCatalog(session.user.id);
  const dueReviews = await getDueReviewSummary(session.user.id);
  const curriculum = await getUserJlptCurriculum(session.user.id);
  const currentLevel = user?.profile?.japaneseLevel ?? "N5";
  const readingCount = await countPublishedReadingsByLevel(currentLevel);
  const listeningCount = await countPublishedListeningsByLevel(currentLevel);

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
        <p className="mt-2 text-sm text-muted-foreground">
          Your JLPT journey: {curriculum.path.join(" → ")}
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
        <section className="mb-8 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Learning skills</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Card className="p-4">
              <p className="text-sm font-medium text-foreground">Vocabulary</p>
              <p className="mt-1 text-xs text-muted-foreground">Lessons &amp; practice</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm font-medium text-foreground">Grammar</p>
              <p className="mt-1 text-xs text-muted-foreground">Lessons &amp; practice</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm font-medium text-foreground">Kanji</p>
              <p className="mt-1 text-xs text-muted-foreground">Lessons &amp; practice</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm font-medium text-foreground">Reading</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {readingCount > 0 ? `${readingCount} passages` : "Coming soon"}
              </p>
              {readingCount > 0 && (
                <Link href="/app/learn/reading" className="mt-3 inline-block">
                  <Button size="sm" variant="secondary">
                    Open reading
                  </Button>
                </Link>
              )}
            </Card>
            <Card className="p-4">
              <p className="text-sm font-medium text-foreground">Listening</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {listeningCount > 0 ? `${listeningCount} exercises` : "Coming soon"}
              </p>
              {listeningCount > 0 && (
                <Link href="/app/learn/listening" className="mt-3 inline-block">
                  <Button size="sm" variant="secondary">
                    Open listening
                  </Button>
                </Link>
              )}
            </Card>
          </div>
        </section>

        <section className="mb-8 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">JLPT level overview</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {curriculum.levels.map((level) => (
              <article key={level.level} className="rounded-lg border border-border p-3">
                <p className="text-sm font-semibold text-foreground">
                  {level.level}
                  {level.isTarget ? " 🎯" : ""}
                  {level.isCurrent ? " • Current" : ""}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{level.name}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {level.completedLessons} / {level.lessonCount} lessons completed
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Preparation progress: {level.progressPercent}%
                </p>
              </article>
            ))}
          </div>
        </section>
        <LessonList levels={levels} />
      </div>
    </div>
  );
}
