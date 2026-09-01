"use client";

import { useMemo, useState } from "react";
import type { ExerciseCheckResult, PracticeSessionPlan } from "@/types/learning";
import { submitExerciseAnswerAction } from "@/server/learning/exercise.actions";
import { ExerciseCard } from "@/components/learning/exercise/exercise-card";
import { PracticeProgress } from "@/components/practice/practice-progress";
import { PracticeSummary } from "@/components/practice/practice-summary";

type PracticeSessionProps = {
  plan: PracticeSessionPlan;
};

export function PracticeSession({ plan }: PracticeSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<ExerciseCheckResult[]>([]);
  const current = plan.exercises[currentIndex];

  const correctCount = useMemo(
    () => results.filter((result) => result.correct).length,
    [results],
  );
  const reviewScheduled = useMemo(
    () => results.filter((result) => Boolean(result.nextReviewAt)).length,
    [results],
  );

  if (!current) {
    return (
      <PracticeSummary
        level={plan.level}
        skill={plan.skill}
        mode={plan.mode}
        total={plan.exercises.length}
        correct={correctCount}
        reviewsScheduled={reviewScheduled}
      />
    );
  }

  return (
    <div className="space-y-5">
      <PracticeProgress current={currentIndex} total={plan.exercises.length} />
      <ExerciseCard
        exercise={current}
        index={currentIndex}
        total={plan.exercises.length}
        onSubmit={submitExerciseAnswerAction}
        onContinue={(result) => {
          setResults((previous) => [...previous, result]);
          setCurrentIndex((previous) => previous + 1);
        }}
      />
    </div>
  );
}

