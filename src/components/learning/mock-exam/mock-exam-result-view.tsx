"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MockExamResult } from "@/types/learning";

type MockExamResultViewProps = {
  result: MockExamResult;
};

export function MockExamResultView({ result }: MockExamResultViewProps) {
  const [showReview, setShowReview] = useState(false);

  if (!showReview) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">{result.scoreLabel}</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">{result.examTitle}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {result.status === "EXPIRED" ? "Time expired" : "Completed"}
          </p>
          <p className="mt-6 text-4xl font-bold text-foreground">{result.scorePercent}%</p>
          <p className="mt-2 text-lg text-muted-foreground">
            {result.correctCount} / {result.totalCount} correct
          </p>
          <div className="mt-6 space-y-2">
            <p className="text-sm font-medium text-foreground">Section performance</p>
            {result.sectionPerformance.map((section) => (
              <div
                key={section.sectionId}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span className="text-foreground">{section.title}</span>
                <span className="font-medium text-foreground">{section.scorePercent}%</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button type="button" onClick={() => setShowReview(true)}>
              Review answers
            </Button>
            <Link href="/app/exams">
              <Button variant="secondary">Back to exams</Button>
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-foreground">Answer review</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {result.correctCount} / {result.totalCount} correct · {result.scorePercent}%
        </p>
      </section>
      <ol className="space-y-4">
        {result.answers.map((answer, index) => (
          <li
            key={answer.questionId}
            className="rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-muted-foreground">Question {index + 1}</p>
            <p className="mt-2 font-medium text-foreground">{answer.questionText}</p>
            <div
              className={cn(
                "mt-4 flex items-start gap-3 rounded-lg px-4 py-3",
                answer.isCorrect ? "bg-success/10" : "bg-error/10",
              )}
            >
              {answer.isCorrect ? (
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
              ) : (
                <XCircle className="mt-0.5 size-5 shrink-0 text-error" aria-hidden="true" />
              )}
              <div>
                <p className="font-semibold text-foreground">
                  {answer.isCorrect ? "Correct" : "Incorrect"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your answer:{" "}
                  <span className="font-medium text-foreground">
                    {answer.selectedOptionText ?? "No answer"}
                  </span>
                </p>
                {!answer.isCorrect && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Correct answer:{" "}
                    <span className="font-medium text-foreground">{answer.correctOptionText}</span>
                  </p>
                )}
                {answer.explanation && (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {answer.explanation}
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
      <Link href="/app/exams">
        <Button variant="secondary">Back to exams</Button>
      </Link>
    </div>
  );
}
