import Link from "next/link";
import { CheckCircle2, Clock, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { LessonSummary } from "@/types/learning";

type LessonCardProps = {
  lesson: LessonSummary;
};

export function LessonCard({ lesson }: LessonCardProps) {
  const progress = lesson.progressPercent ?? 0;
  const isCompleted = lesson.lessonStatus === "COMPLETED";
  const isLocked = lesson.locked ?? false;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Lesson {lesson.order}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-foreground">
            {isLocked ? (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Lock className="size-4" aria-hidden="true" />
                {lesson.title}
              </span>
            ) : (
              <Link
                href={`/app/learn/${lesson.slug}`}
                className="hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
              >
                {lesson.title}
              </Link>
            )}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {lesson.description}
          </p>
          {!isLocked && (
            <div className="mt-3">
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {isCompleted ? "Completed" : `${progress}% progress`}
              </p>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/20 px-2.5 py-1 text-xs font-medium text-foreground">
            <Clock className="size-3.5" aria-hidden="true" />
            {lesson.estimatedMinutes} min
          </span>
          {isCompleted && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              Done
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
