"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { submitExerciseAnswerAction } from "@/server/learning/exercise.actions";
import { Button } from "@/components/ui/button";
import type { ClientExercise } from "@/types/learning";
import { ExerciseCard } from "@/components/learning/exercise/exercise-card";

type ExerciseListProps = {
  exercises: ClientExercise[];
  backHref?: string;
};

export function ExerciseList({ exercises, backHref }: ExerciseListProps) {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<{ correct: boolean }[]>([]);

  const current = exercises[index];
  const correctCount = useMemo(
    () => results.filter((result) => result.correct).length,
    [results],
  );

  if (exercises.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Exercises for this lesson are coming soon.
      </p>
    );
  }

  if (!started) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground">Practice session</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Complete {exercises.length} exercises. Results update your lesson progress and review schedule.
        </p>
        <div className="mt-4">
          <Button type="button" onClick={() => setStarted(true)}>
            Start practice
          </Button>
        </div>
      </div>
    );
  }

  if (!current) {
    const scorePercent = Math.round((correctCount / exercises.length) * 100);
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-2xl font-bold text-foreground">Practice complete 🎉</h3>
        <p className="mt-2 text-muted-foreground">
          {correctCount} / {exercises.length} correct
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{scorePercent}% score</p>
        <p className="mt-3 text-sm text-muted-foreground">
          Mastery has been updated and next reviews are scheduled.
        </p>
        <div className="mt-4 flex gap-2">
          {backHref && (
            <Link href={backHref}>
              <Button type="button">Back to lesson</Button>
            </Link>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setIndex(0);
              setResults([]);
              setStarted(false);
            }}
          >
            Practice again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ExerciseCard
        key={current.id}
        exercise={current}
        index={index}
        total={exercises.length}
        onSubmit={submitExerciseAnswerAction}
        onContinue={(result) => {
          setResults((previous) => [...previous, { correct: result.correct }]);
          setIndex((currentIndex) => currentIndex + 1);
        }}
      />
    </div>
  );
}
