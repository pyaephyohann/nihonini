import { Card } from "@/components/ui/card";

const jlptLevels = [
  {
    level: "N5",
    title: "Beginner",
    description: "Basic phrases, hiragana, katakana, and ~800 vocabulary words.",
    color: "bg-emerald-100 text-emerald-800",
  },
  {
    level: "N4",
    title: "Elementary",
    description: "Everyday expressions and ~1,500 vocabulary words.",
    color: "bg-sky-100 text-sky-800",
  },
  {
    level: "N3",
    title: "Intermediate",
    description: "Daily conversation and ~3,750 vocabulary words.",
    color: "bg-violet-100 text-violet-800",
  },
  {
    level: "N2",
    title: "Upper Intermediate",
    description: "Business and academic Japanese, ~6,000 vocabulary words.",
    color: "bg-orange-100 text-orange-800",
  },
  {
    level: "N1",
    title: "Advanced",
    description: "Near-native fluency, ~10,000 vocabulary words.",
    color: "bg-rose-100 text-rose-800",
  },
];

export function JlptSection() {
  return (
    <section
      id="jlpt"
      aria-labelledby="jlpt-heading"
      className="bg-muted py-16 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="jlpt-heading"
            className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            JLPT preparation from{" "}
            <span className="font-japanese">N5</span> to{" "}
            <span className="font-japanese">N1</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Structured preparation for the Japanese Language Proficiency Test.
            Progress through each level with targeted vocabulary, grammar, and
            mock exams.
          </p>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-4">
          {jlptLevels.map((item) => (
            <Card
              key={item.level}
              className="w-full max-w-[220px] text-center transition-shadow hover:shadow-md sm:w-auto"
            >
              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${item.color}`}
              >
                {item.level}
              </span>
              <h3 className="mt-3 font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </Card>
          ))}
        </div>

        <p className="mt-8 text-center font-display text-xl text-muted-foreground">
          Ganbatte! 頑張って！
        </p>
      </div>
    </section>
  );
}
