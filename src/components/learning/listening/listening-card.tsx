import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ListeningListItem } from "@/types/learning";

type ListeningCardProps = {
  listening: ListeningListItem;
};

export function ListeningCard({ listening }: ListeningCardProps) {
  return (
    <Card className="flex flex-col justify-between p-5">
      <div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-japanese font-semibold text-foreground">{listening.jlptLevel}</span>
          <span>·</span>
          <span>{listening.estimatedMinutes} min</span>
          <span>·</span>
          <span>{listening.difficultyLabel}</span>
        </div>
        <h3 className="mt-2 text-lg font-semibold text-foreground">{listening.title}</h3>
        {listening.subtitle && (
          <p className="mt-1 font-japanese text-sm text-muted-foreground">{listening.subtitle}</p>
        )}
        {listening.attemptCount > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            {listening.completed ? "Completed" : "In progress"} · Best {Math.round(listening.bestScore)}%
          </p>
        )}
      </div>
      <div className="mt-4">
        <Link href={`/app/learn/listening/${listening.slug}`}>
          <Button size="sm" className="w-full sm:w-auto">
            {listening.attemptCount > 0 ? "Continue listening" : "Start listening"}
          </Button>
        </Link>
      </div>
    </Card>
  );
}
