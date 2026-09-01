import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/server/auth/require-auth";
import { getReadingCatalog, getRecommendedReading } from "@/server/learning/reading.service";
import { ReadingCard } from "@/components/learning/reading/reading-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Reading",
};

export default async function ReadingListPage() {
  const session = await requireAuth();
  const catalog = await getReadingCatalog(session.user.id);
  const recommended = await getRecommendedReading(session.user.id);

  const hasReadings = catalog.some((level) => level.readings.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <Link href="/app/learn">
          <Button variant="ghost" size="sm">
            ← Back to learning
          </Button>
        </Link>
        <p className="mt-4 font-display text-xl text-muted-foreground">読む</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Reading</h1>
        <p className="mt-3 text-muted-foreground">
          Read Japanese passages and answer comprehension questions. Content is
          level-appropriate and answerable from the passage alone.
        </p>
      </div>

      {recommended && (
        <Card className="mt-8 p-5">
          <h2 className="text-sm font-medium text-muted-foreground">Recommended for you</h2>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {recommended.jlptLevel} — {recommended.title}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {recommended.estimatedMinutes} min · {recommended.difficultyLabel}
          </p>
          <div className="mt-4">
            <Link href={`/app/learn/reading/${recommended.slug}`}>
              <Button size="sm">Continue reading</Button>
            </Link>
          </div>
        </Card>
      )}

      {!hasReadings ? (
        <Card className="mt-8 p-6">
          <p className="text-muted-foreground">
            Reading content is coming soon for your level. Check back as more passages are
            published.
          </p>
        </Card>
      ) : (
        <div className="mt-10 space-y-10">
          {catalog.map((level) =>
            level.readings.length > 0 ? (
              <section key={level.level} aria-labelledby={`reading-level-${level.level}`}>
                <h2
                  id={`reading-level-${level.level}`}
                  className="font-japanese text-2xl font-bold text-foreground"
                >
                  {level.level} Reading
                </h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {level.readings.map((reading) => (
                    <ReadingCard key={reading.id} reading={reading} />
                  ))}
                </div>
              </section>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}
