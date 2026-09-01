import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/server/auth/require-auth";
import { getLessonBySlug } from "@/server/learning/lesson.service";
import { LessonHeader } from "@/components/learning/lesson-header";
import { VocabularyCard } from "@/components/learning/vocabulary-card";
import { GrammarCard } from "@/components/learning/grammar-card";
import { KanjiCard } from "@/components/learning/kanji-card";
import { ExerciseList } from "@/components/learning/exercise/exercise-list";
import { Button } from "@/components/ui/button";

type LessonPageProps = {
  params: Promise<{ lessonSlug: string }>;
};

export async function generateMetadata({
  params,
}: LessonPageProps): Promise<Metadata> {
  const { lessonSlug } = await params;
  const lesson = await getLessonBySlug(lessonSlug);

  if (!lesson) {
    return { title: "Lesson not found" };
  }

  return {
    title: lesson.title,
  };
}

export default async function LessonPage({ params }: LessonPageProps) {
  await requireAuth();
  const { lessonSlug } = await params;
  const lesson = await getLessonBySlug(lessonSlug);

  if (!lesson) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/app/learn">
        <Button variant="ghost" size="sm" className="mb-6">
          ← All lessons
        </Button>
      </Link>

      <LessonHeader lesson={lesson} />

      {lesson.vocabularies.length > 0 && (
        <section aria-labelledby="vocabulary-heading" className="mt-12">
          <h2
            id="vocabulary-heading"
            className="text-2xl font-bold text-foreground"
          >
            Vocabulary
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {lesson.vocabularies.map((item) => (
              <VocabularyCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {lesson.grammars.length > 0 && (
        <section aria-labelledby="grammar-heading" className="mt-12">
          <h2 id="grammar-heading" className="text-2xl font-bold text-foreground">
            Grammar
          </h2>
          <div className="mt-6 grid gap-4">
            {lesson.grammars.map((item) => (
              <GrammarCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {lesson.kanji.length > 0 && (
        <section aria-labelledby="kanji-heading" className="mt-12">
          <h2 id="kanji-heading" className="text-2xl font-bold text-foreground">
            Kanji
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lesson.kanji.map((item) => (
              <KanjiCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="exercises-heading" className="mt-12">
        <h2 id="exercises-heading" className="text-2xl font-bold text-foreground">
          Exercises
        </h2>
        <div className="mt-6">
          <ExerciseList exercises={lesson.exercises} backHref={`/app/learn/${lesson.slug}`} />
        </div>
      </section>
    </div>
  );
}
