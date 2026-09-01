import { ExerciseCard } from "@/components/learning/exercise/exercise-card";
import type { ClientExercise } from "@/types/learning";

type ExerciseListProps = {
  exercises: ClientExercise[];
};

export function ExerciseList({ exercises }: ExerciseListProps) {
  if (exercises.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Exercises for this lesson are coming soon.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {exercises.map((exercise, index) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          index={index}
          total={exercises.length}
        />
      ))}
    </div>
  );
}
