import type { Metadata } from "next";
import { requireAuth } from "@/server/auth/require-auth";
import { getMockExamCatalog, getMockExamHistory } from "@/server/learning/mock-exam.service";
import { MockExamCard } from "@/components/learning/mock-exam/mock-exam-card";
import { MockExamHistoryList } from "@/components/learning/mock-exam/mock-exam-history-list";

export const metadata: Metadata = {
  title: "Mock Exams",
};

export default async function MockExamsPage() {
  const session = await requireAuth();
  const [catalog, history] = await Promise.all([
    getMockExamCatalog(session.user.id),
    getMockExamHistory(session.user.id),
  ]);

  const hasExams = catalog.some((level) => level.exams.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">JLPT Mock Exams</h1>
        <p className="mt-3 text-muted-foreground">
          Timed practice exams with section performance. These are Nihonini practice assessments,
          not official JLPT exams.
        </p>
      </header>

      {!hasExams ? (
        <p className="mt-8 text-muted-foreground">No mock exams are available yet.</p>
      ) : (
        <div className="mt-8 space-y-10">
          {catalog.map((levelGroup) =>
            levelGroup.exams.length > 0 ? (
              <section key={levelGroup.level}>
                <h2 className="text-xl font-semibold text-foreground">{levelGroup.level}</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {levelGroup.exams.map((exam) => (
                    <MockExamCard key={exam.id} exam={exam} />
                  ))}
                </div>
              </section>
            ) : null,
          )}
        </div>
      )}

      <div className="mt-12">
        <MockExamHistoryList history={history} />
      </div>
    </div>
  );
}
