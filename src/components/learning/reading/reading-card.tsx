import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ReadingListItem } from "@/types/learning";

type ReadingCardProps = {
  reading: ReadingListItem;
};

export function ReadingCard({ reading }: ReadingCardProps) {
  return (
    <Card className="flex flex-col justify-between p-5">
      <div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-japanese font-semibold text-foreground">{reading.jlptLevel}</span>
          <span>·</span>
          <span>{reading.estimatedMinutes} min</span>
          <span>·</span>
          <span>{reading.difficultyLabel}</span>
        </div>
        <h3 className="mt-2 text-lg font-semibold text-foreground">{reading.title}</h3>
        {reading.subtitle && (
          <p className="mt-1 font-japanese text-sm text-muted-foreground">{reading.subtitle}</p>
        )}
        {reading.description && (
          <p className="mt-2 text-sm text-muted-foreground">{reading.description}</p>
        )}
        {reading.attemptCount > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            {reading.completed ? "Completed" : "In progress"} · Best {Math.round(reading.bestScore)}%
            {reading.lastScore > 0 && ` · Last ${Math.round(reading.lastScore)}%`}
          </p>
        )}
      </div>
      <div className="mt-4">
        <Link href={`/app/learn/reading/${reading.slug}`}>
          <Button size="sm" className="w-full sm:w-auto">
            {reading.attemptCount > 0 ? "Continue reading" : "Start reading"}
          </Button>
        </Link>
      </div>
    </Card>
  );
}
