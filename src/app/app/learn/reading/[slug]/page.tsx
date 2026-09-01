import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/server/auth/require-auth";
import { getReadingBySlug } from "@/server/learning/reading.service";
import { ReadingSession } from "@/components/learning/reading/reading-session";
import { Button } from "@/components/ui/button";

type ReadingDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ReadingDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug.replaceAll("-", " ") };
}

export default async function ReadingDetailPage({ params }: ReadingDetailPageProps) {
  const session = await requireAuth();
  const { slug } = await params;
  const reading = await getReadingBySlug(session.user.id, slug);

  if (!reading) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/app/learn/reading">
        <Button variant="ghost" size="sm" className="mb-6">
          ← Back to reading
        </Button>
      </Link>

      <header className="mb-8 max-w-2xl">
        <p className="text-sm text-muted-foreground">
          {reading.jlptLevel} · {reading.difficultyLabel} · {reading.estimatedMinutes} min
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          {reading.title}
        </h1>
        {reading.subtitle && (
          <p className="mt-2 font-japanese text-lg text-muted-foreground">{reading.subtitle}</p>
        )}
        {reading.description && (
          <p className="mt-3 text-muted-foreground">{reading.description}</p>
        )}
      </header>

      <ReadingSession reading={reading} />
    </div>
  );
}
