import { LessonCard } from "@/components/learning/lesson-card";
import type { JlptLevelWithLessons } from "@/types/learning";

type LessonListProps = {
  levels: JlptLevelWithLessons[];
};

export function LessonList({ levels }: LessonListProps) {
  return (
    <div className="space-y-10">
      {levels.map((level) => (
        <section key={level.id} aria-labelledby={`level-${level.code}`}>
          <div className="mb-4">
            <h2
              id={`level-${level.code}`}
              className="font-japanese text-2xl font-bold text-foreground"
            >
              {level.code}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{level.description}</p>
          </div>

          {level.lessons.length > 0 ? (
            <div className="grid gap-4">
              {level.lessons.map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Lessons coming soon for this level.
            </p>
          )}
        </section>
      ))}
    </div>
  );
}
