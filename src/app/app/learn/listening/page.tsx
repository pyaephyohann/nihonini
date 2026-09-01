import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/server/auth/require-auth";
import { getListeningCatalog, getRecommendedListening } from "@/server/learning/listening.service";
import { ListeningCard } from "@/components/learning/listening/listening-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Listening",
};

export default async function ListeningListPage() {
  const session = await requireAuth();
  const catalog = await getListeningCatalog(session.user.id);
  const recommended = await getRecommendedListening(session.user.id);

  const hasListenings = catalog.some((level) => level.listenings.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <Link href="/app/learn">
          <Button variant="ghost" size="sm">
            ← Back to learning
          </Button>
        </Link>
        <p className="mt-4 font-display text-xl text-muted-foreground">聞く</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Listening</h1>
        <p className="mt-3 text-muted-foreground">
          Listen to Japanese audio and answer comprehension questions. Replay as often as you
          need while answering.
        </p>
      </div>

      {recommended && (
        <Card className="mt-8 p-5">
          <h2 className="text-sm font-medium text-muted-foreground">Recommended for you</h2>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {recommended.jlptLevel} — {recommended.title}
          </p>
          <div className="mt-4">
            <Link href={`/app/learn/listening/${recommended.slug}`}>
              <Button size="sm">Continue listening</Button>
            </Link>
          </div>
        </Card>
      )}

      {!hasListenings ? (
        <Card className="mt-8 p-6">
          <p className="text-muted-foreground">
            Listening content is coming soon for your level.
          </p>
        </Card>
      ) : (
        <div className="mt-10 space-y-10">
          {catalog.map((level) =>
            level.listenings.length > 0 ? (
              <section key={level.level} aria-labelledby={`listening-level-${level.level}`}>
                <h2
                  id={`listening-level-${level.level}`}
                  className="font-japanese text-2xl font-bold text-foreground"
                >
                  {level.level} Listening
                </h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {level.listenings.map((item) => (
                    <ListeningCard key={item.id} listening={item} />
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
