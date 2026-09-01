"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ClientExercise, ExerciseCheckResult } from "@/types/learning";

type ExerciseCardProps = {
  exercise: ClientExercise;
  index: number;
  total: number;
  onSubmit: (input: {
    exerciseId: string;
    selectedOptionId?: string;
    textAnswer?: string;
    timeSpentMs?: number;
  }) => Promise<ExerciseCheckResult | { error: string }>;
  onContinue: (result: ExerciseCheckResult) => void;
};

export function ExerciseCard({ exercise, index, total, onSubmit, onContinue }: ExerciseCardProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [result, setResult] = useState<ExerciseCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [startedAt] = useState(() => Date.now());

  const isChoiceType =
    exercise.type === "MULTIPLE_CHOICE" ||
    exercise.type === "MATCHING" ||
    exercise.type === "ORDERING";

  const isTextType =
    exercise.type === "FILL_BLANK" || exercise.type === "TRANSLATION";

  const handleCheck = () => {
    setError(null);
    startTransition(async () => {
      const response = await onSubmit({
        exerciseId: exercise.id,
        selectedOptionId: selectedOptionId ?? undefined,
        textAnswer: textAnswer || undefined,
        timeSpentMs: Date.now() - startedAt,
      });

      if ("error" in response) {
        setError(response.error);
        return;
      }

      setResult(response);
    });
  };

  const handleContinue = () => {
    if (result) {
      onContinue(result);
    }
  };

  return (
    <article
      aria-labelledby={`exercise-${exercise.id}-title`}
      className="rounded-xl border border-border bg-card p-6 shadow-sm"
    >
      <p className="text-sm font-medium text-muted-foreground">
        Question {index + 1} / {total}
      </p>
      <h3
        id={`exercise-${exercise.id}-title`}
        className="mt-2 text-lg font-semibold text-foreground"
      >
        {exercise.question}
      </h3>

      {!result && (
        <div className="mt-6 space-y-4">
          {isChoiceType && (
            <fieldset>
              <legend className="sr-only">Choose an answer</legend>
              <ul className="space-y-2" role="list">
                {exercise.options.map((option) => (
                  <li key={option.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedOptionId(option.id)}
                      aria-pressed={selectedOptionId === option.id}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                        selectedOptionId === option.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-secondary hover:bg-muted",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "size-4 shrink-0 rounded-full border",
                          selectedOptionId === option.id
                            ? "border-primary bg-primary"
                            : "border-border",
                        )}
                      />
                      <span>{option.text}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </fieldset>
          )}

          {isTextType && (
            <div>
              <label
                htmlFor={`answer-${exercise.id}`}
                className="sr-only"
              >
                Your answer
              </label>
              <Input
                id={`answer-${exercise.id}`}
                value={textAnswer}
                onChange={(event) => setTextAnswer(event.target.value)}
                placeholder="Type your answer"
                disabled={isPending}
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-error" role="alert">
              {error}
            </p>
          )}

          <Button
            type="button"
            onClick={handleCheck}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            {isPending ? "Checking..." : "Check answer"}
          </Button>
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-4">
          <div
            className={cn(
              "flex items-start gap-3 rounded-lg px-4 py-3",
              result.correct ? "bg-success/10" : "bg-error/10",
            )}
            role="status"
          >
            {result.correct ? (
              <CheckCircle2
                className="mt-0.5 size-5 shrink-0 text-success"
                aria-hidden="true"
              />
            ) : (
              <XCircle
                className="mt-0.5 size-5 shrink-0 text-error"
                aria-hidden="true"
              />
            )}
            <div>
              <p className="font-semibold text-foreground">
                {result.correct ? "Correct!" : "Not quite."}
              </p>
              {!result.correct && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Correct answer:{" "}
                  <span className="font-medium text-foreground">
                    {result.correctAnswer}
                  </span>
                </p>
              )}
              {result.explanation && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {result.explanation}
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Lesson progress: {result.lessonProgress}% · Status:{" "}
                {result.lessonStatus === "COMPLETED" ? "Completed" : "In progress"}
              </p>
              {result.nextReviewAt && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Next review: {new Date(result.nextReviewAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          <Button type="button" variant="secondary" onClick={handleContinue}>
            Continue
          </Button>
        </div>
      )}
    </article>
  );
}
