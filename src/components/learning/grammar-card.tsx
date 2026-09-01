import { Card } from "@/components/ui/card";
import type { LessonGrammarItem } from "@/types/learning";

type GrammarCardProps = {
  item: LessonGrammarItem;
};

export function GrammarCard({ item }: GrammarCardProps) {
  return (
    <Card>
      <p className="font-japanese text-xl font-bold text-foreground">
        {item.pattern}
      </p>
      <p className="mt-1 text-sm font-medium text-muted-foreground">
        {item.meaning}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {item.explanation}
      </p>
      <p className="mt-3 rounded-lg bg-muted/60 px-3 py-2 font-mono text-sm text-foreground">
        {item.structure}
      </p>
      {item.exampleSentence && (
        <div className="mt-4 rounded-lg border border-border px-3 py-2">
          <p className="font-japanese text-sm text-foreground">
            {item.exampleSentence}
          </p>
          {item.exampleReading && (
            <p className="mt-1 font-japanese text-xs text-muted-foreground">
              {item.exampleReading}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
