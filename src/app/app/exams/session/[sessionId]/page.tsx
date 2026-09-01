import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/server/auth/require-auth";
import { getMockExamSessionState } from "@/server/learning/mock-exam.service";
import { MockExamSession } from "@/components/learning/mock-exam/mock-exam-session";
import { Button } from "@/components/ui/button";

type MockExamSessionPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function MockExamSessionPage({ params }: MockExamSessionPageProps) {
  const authSession = await requireAuth();
  const { sessionId } = await params;
  const state = await getMockExamSessionState({
    userId: authSession.user.id,
    sessionId,
  });

  if ("error" in state) {
    notFound();
  }

  if ("scoreLabel" in state) {
    redirect(`/app/exams/result/${sessionId}`);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/app/exams">
        <Button variant="ghost" size="sm" className="mb-6">
          ← Back to mock exams
        </Button>
      </Link>
      <MockExamSession initialState={state} />
    </div>
  );
}
