import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/server/auth/require-auth";
import { getMockExamResult } from "@/server/learning/mock-exam.service";
import { MockExamResultView } from "@/components/learning/mock-exam/mock-exam-result-view";
import { Button } from "@/components/ui/button";

type MockExamResultPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function MockExamResultPage({ params }: MockExamResultPageProps) {
  const authSession = await requireAuth();
  const { sessionId } = await params;
  const result = await getMockExamResult({
    userId: authSession.user.id,
    sessionId,
  });

  if ("error" in result) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/app/exams">
        <Button variant="ghost" size="sm" className="mb-6">
          ← Back to mock exams
        </Button>
      </Link>
      <MockExamResultView result={result} />
    </div>
  );
}
