import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/server/auth/require-auth";
import { getMockExamBySlug } from "@/server/learning/mock-exam.service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StartMockExamButton } from "@/components/learning/mock-exam/start-mock-exam-button";

type MockExamDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: MockExamDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug.replaceAll("-", " ") };
}

export default async function MockExamDetailPage({ params }: MockExamDetailPageProps) {
  const session = await requireAuth();
  const { slug } = await params;
  const exam = await getMockExamBySlug(session.user.id, slug);

  if (!exam) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/app/exams">
        <Button variant="ghost" size="sm" className="mb-6">
          ← Back to mock exams
        </Button>
      </Link>

      <header>
        <p className="text-sm text-muted-foreground">{exam.jlptLevel}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">{exam.title}</h1>
        {exam.description && (
          <p className="mt-3 text-muted-foreground">{exam.description}</p>
        )}
      </header>

      <Card className="mt-8 p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">Questions</dt>
            <dd className="mt-1 text-lg font-semibold text-foreground">{exam.questionCount}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Duration</dt>
            <dd className="mt-1 text-lg font-semibold text-foreground">{exam.durationLabel}</dd>
          </div>
        </dl>

        <div className="mt-6">
          <p className="text-sm font-medium text-foreground">Sections</p>
          <ul className="mt-2 space-y-2">
            {exam.sections.map((section) => (
              <li
                key={section.id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span className="text-foreground">{section.title}</span>
                <span className="text-muted-foreground">
                  {section.questionCount} question{section.questionCount === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6">
          <StartMockExamButton
            mockExamId={exam.id}
            activeSessionId={exam.activeSessionId}
          />
        </div>
      </Card>
    </div>
  );
}
