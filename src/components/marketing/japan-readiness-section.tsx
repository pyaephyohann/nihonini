import { Card } from "@/components/ui/card";

const scenarios = [
  { emoji: "🏫", label: "School", japanese: "学校" },
  { emoji: "💼", label: "Work", japanese: "仕事" },
  { emoji: "🗣️", label: "Conversation", japanese: "会話" },
  { emoji: "🛒", label: "Shopping", japanese: "買い物" },
  { emoji: "🍜", label: "Restaurants", japanese: "レストラン" },
  { emoji: "🚉", label: "Transportation", japanese: "交通" },
];

export function JapanReadinessSection() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="japan-heading"
      className="bg-secondary py-16 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="japan-heading"
            className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            Learn Japanese for real life in Japan
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Beyond textbooks — practice the Japanese you&apos;ll actually use
            when studying, working, and living in Japan.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((scenario) => (
            <Card
              key={scenario.label}
              className="flex items-center gap-4 transition-shadow hover:shadow-md"
            >
              <span
                className="text-3xl"
                role="img"
                aria-label={scenario.label}
              >
                {scenario.emoji}
              </span>
              <div>
                <h3 className="font-semibold text-foreground">
                  {scenario.label}
                </h3>
                <p className="font-japanese text-sm text-muted-foreground">
                  {scenario.japanese}
                </p>
              </div>
            </Card>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Real-world scenarios coming soon — practice before you arrive.
        </p>
      </div>
    </section>
  );
}
