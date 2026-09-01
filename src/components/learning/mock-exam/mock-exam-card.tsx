import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { MockExamListItem } from "@/types/learning";

type MockExamCardProps = {
  exam: MockExamListItem;
};

export function MockExamCard({ exam }: MockExamCardProps) {
  const continueSession = exam.activeSessionId !== null;

  return (
    <Card className="flex h-full flex-col p-5">
      <p className="text-sm text-muted-foreground">{exam.jlptLevel}</p>
      <h3 className="mt-1 text-lg font-semibold text-foreground">{exam.title}</h3>
      {exam.description && (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{exam.description}</p>
      )}
      <p className="mt-4 text-sm text-muted-foreground">
        {exam.questionCount} questions · {exam.durationLabel}
      </p>
      <div className="mt-5">
        {continueSession ? (
          <Link href={`/app/exams/session/${exam.activeSessionId}`}>
            <Button className="w-full sm:w-auto">Continue exam</Button>
          </Link>
        ) : (
          <Link href={`/app/exams/${exam.slug}`}>
            <Button className="w-full sm:w-auto">View exam</Button>
          </Link>
        )}
      </div>
    </Card>
  );
}
