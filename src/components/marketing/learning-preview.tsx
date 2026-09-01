import {
  BookOpen,
  BookText,
  Ear,
  Languages,
  Mic,
  PenLine,
} from "lucide-react";
import { Card } from "@/components/ui/card";

const learningAreas = [
  {
    icon: Languages,
    title: "Vocabulary",
    description: "Build your word bank with contextual, JLPT-aligned vocabulary.",
    japanese: "語彙",
  },
  {
    icon: BookText,
    title: "Grammar",
    description: "Master sentence patterns from beginner basics to advanced structures.",
    japanese: "文法",
  },
  {
    icon: PenLine,
    title: "Kanji",
    description: "Learn characters with readings, meanings, and stroke order guidance.",
    japanese: "漢字",
  },
  {
    icon: BookOpen,
    title: "Reading",
    description: "Practice with graded passages tailored to your level.",
    japanese: "読解",
  },
  {
    icon: Ear,
    title: "Listening",
    description: "Train your ear with native-speed audio and comprehension exercises.",
    japanese: "聴解",
  },
  {
    icon: Mic,
    title: "Speaking",
    description: "Build confidence with pronunciation and conversation practice.",
    japanese: "会話",
  },
];

export function LearningPreview() {
  return (
    <section
      id="features"
      aria-labelledby="learning-heading"
      className="bg-background py-16 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="learning-heading"
            className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            Everything you need to learn Japanese
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A complete learning platform covering every skill — from your first
            words to fluent conversation.{" "}
            <span className="font-japanese text-foreground">すべてのスキル</span>
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {learningAreas.map((area) => (
            <Card
              key={area.title}
              className="group transition-shadow hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div
                  aria-hidden="true"
                  className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-foreground transition-colors group-hover:bg-primary/30"
                >
                  <area.icon className="size-5" strokeWidth={2} />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-semibold text-foreground">
                      {area.title}
                    </h3>
                    <span className="font-japanese text-xs text-muted-foreground">
                      {area.japanese}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {area.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Coming soon — structured lessons for each skill area.
        </p>
      </div>
    </section>
  );
}
