import { Card } from "@/components/ui/card";
import type { LessonKanjiItem } from "@/types/learning";

type KanjiCardProps = {
  item: LessonKanjiItem;
};

export function KanjiCard({ item }: KanjiCardProps) {
  return (
    <Card className="text-center">
      <p className="font-japanese text-5xl font-bold text-foreground">
        {item.character}
      </p>
      <p className="mt-3 text-sm font-medium text-foreground">{item.meaning}</p>
      <dl className="mt-4 space-y-2 text-left text-sm">
        <div>
          <dt className="text-muted-foreground">On&apos;yomi</dt>
          <dd className="font-japanese font-medium text-foreground">
            {item.onyomi}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Kun&apos;yomi</dt>
          <dd className="font-japanese font-medium text-foreground">
            {item.kunyomi}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Strokes</dt>
          <dd className="font-medium text-foreground">{item.strokeCount}</dd>
        </div>
      </dl>
    </Card>
  );
}
