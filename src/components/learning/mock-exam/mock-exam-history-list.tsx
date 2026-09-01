import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { MockExamHistoryItem } from "@/types/learning";

type MockExamHistoryListProps = {
  history: MockExamHistoryItem[];
};

export function MockExamHistoryList({ history }: MockExamHistoryListProps) {
  if (history.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground">Exam history</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Complete a mock exam to see your assessment history here.
        </p>
      </Card>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Exam history</h2>
      <div className="space-y-3">
        {history.map((item) => (
          <Card key={item.sessionId} className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-foreground">{item.examTitle}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.jlptLevel} · {item.scorePercent}% ·{" "}
                  {item.submittedAt
                    ? new Date(item.submittedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Completed"}
                </p>
              </div>
              <Link href={`/app/exams/result/${item.sessionId}`}>
                <Button variant="secondary" size="sm">
                  View result
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
