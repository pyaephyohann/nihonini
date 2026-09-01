import { Card } from "@/components/ui/card";
import type { LessonVocabularyItem } from "@/types/learning";

const partOfSpeechLabels: Record<LessonVocabularyItem["partOfSpeech"], string> = {
  NOUN: "Noun",
  VERB: "Verb",
  ADJECTIVE: "Adjective",
  ADVERB: "Adverb",
  PARTICLE: "Particle",
  EXPRESSION: "Expression",
  OTHER: "Other",
};

type VocabularyCardProps = {
  item: LessonVocabularyItem;
};

export function VocabularyCard({ item }: VocabularyCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-japanese text-2xl font-bold text-foreground">
            {item.word}
          </p>
          <p className="mt-1 font-japanese text-sm text-muted-foreground">
            {item.reading}
          </p>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {partOfSpeechLabels[item.partOfSpeech]}
        </span>
      </div>
      <p className="mt-3 text-foreground">{item.meaning}</p>
      {item.exampleSentence && (
        <div className="mt-4 rounded-lg bg-muted/60 px-3 py-2">
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
      {item.kanji.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Kanji:{" "}
          {item.kanji.map((k) => (
            <span key={k.character} className="font-japanese mr-2">
              {k.character} ({k.meaning})
            </span>
          ))}
        </p>
      )}
    </Card>
  );
}
