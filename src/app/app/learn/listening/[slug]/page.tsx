import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/server/auth/require-auth";
import { getListeningBySlug } from "@/server/learning/listening.service";
import { ListeningSession } from "@/components/learning/listening/listening-session";
import { Button } from "@/components/ui/button";

type ListeningDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ListeningDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug.replaceAll("-", " ") };
}

export default async function ListeningDetailPage({ params }: ListeningDetailPageProps) {
  const session = await requireAuth();
  const { slug } = await params;
  const listening = await getListeningBySlug(session.user.id, slug);

  if (!listening) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/app/learn/listening">
        <Button variant="ghost" size="sm" className="mb-6">
          ← Back to listening
        </Button>
      </Link>

      <header className="mb-8 max-w-2xl">
        <p className="text-sm text-muted-foreground">
          {listening.jlptLevel} · {listening.difficultyLabel} · {listening.estimatedMinutes} min
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          {listening.title}
        </h1>
        {listening.subtitle && (
          <p className="mt-2 font-japanese text-lg text-muted-foreground">{listening.subtitle}</p>
        )}
      </header>

      <ListeningSession listening={listening} />
    </div>
  );
}
