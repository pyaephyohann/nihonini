"use client";

import { useMemo, useState } from "react";
import { LessonCard } from "@/components/learning/lesson-card";
import type { JlptLevelWithLessons } from "@/types/learning";

type LessonListProps = {
  levels: JlptLevelWithLessons[];
};

export function LessonList({ levels }: LessonListProps) {
  const [levelFilter, setLevelFilter] = useState<"ALL" | "N5" | "N4" | "N3" | "N2" | "N1">(
    "ALL",
  );
  const [categoryFilter, setCategoryFilter] = useState<
    "ALL" | "VOCABULARY" | "GRAMMAR" | "KANJI" | "MIXED"
  >("ALL");

  const filteredLevels = useMemo(() => {
    const selectedLevels = levelFilter === "ALL"
      ? levels
      : levels.filter((level) => level.code === levelFilter);

    return selectedLevels.map((level) => ({
      ...level,
      lessons: level.lessons.filter((lesson) =>
        categoryFilter === "ALL" ? true : lesson.category === categoryFilter,
      ),
    }));
  }, [categoryFilter, levelFilter, levels]);

  return (
    <div className="space-y-10">
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {(["ALL", "N5", "N4", "N3", "N2", "N1"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setLevelFilter(value)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                levelFilter === value
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["ALL", "VOCABULARY", "GRAMMAR", "KANJI", "MIXED"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategoryFilter(value)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                categoryFilter === value
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              {value === "ALL" ? "All categories" : value.toLowerCase()}
            </button>
          ))}
        </div>
      </section>

      {filteredLevels.map((level) => (
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
              {categoryFilter === "ALL"
                ? "Lessons coming soon for this level."
                : "No lessons in this category yet."}
            </p>
          )}
        </section>
      ))}
    </div>
  );
}
