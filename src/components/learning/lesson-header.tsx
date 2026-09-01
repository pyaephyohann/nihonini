import { Clock } from "lucide-react";
import type { LessonDetail } from "@/types/learning";

type LessonHeaderProps = {
  lesson: Pick<
    LessonDetail,
    | "title"
    | "description"
    | "jlptLevel"
    | "category"
    | "order"
    | "estimatedMinutes"
  >;
};

export function LessonHeader({ lesson }: LessonHeaderProps) {
  return (
    <header className="border-b border-border pb-8">
      <p className="text-sm font-medium text-muted-foreground">
        <span className="font-japanese">{lesson.jlptLevel}</span> ·{" "}
        {lesson.category.replaceAll("_", " ")} · Lesson {lesson.order}
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {lesson.title}
      </h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        {lesson.description}
      </p>
      <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="size-4" aria-hidden="true" />
        Estimated study time: {lesson.estimatedMinutes} minutes
      </p>
    </header>
  );
}
