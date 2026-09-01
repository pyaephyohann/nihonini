import Link from "next/link";
import { Button } from "@/components/ui/button";

type PracticeSkillCardsProps = {
  availability: Record<
    "N5" | "N4" | "N3" | "N2" | "N1",
    { VOCABULARY: number; GRAMMAR: number; KANJI: number }
  >;
};

const levelOrder = ["N5", "N4", "N3", "N2", "N1"] as const;

const skills = [
  {
    key: "VOCABULARY" as const,
    title: "Vocabulary",
    description: "Learn and review words",
  },
  {
    key: "GRAMMAR" as const,
    title: "Grammar",
    description: "Strengthen sentence patterns",
  },
  {
    key: "KANJI" as const,
    title: "Kanji",
    description: "Build kanji recognition",
  },
];

export function PracticeSkillCards({ availability }: PracticeSkillCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {skills.map((skill) => {
        const firstActiveLevel = levelOrder.find(
          (level) => availability[level][skill.key] > 0,
        );

        return (
          <div key={skill.key} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground">{skill.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{skill.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {levelOrder.map((level) => {
                const active = availability[level][skill.key] > 0;
                return (
                  <span
                    key={level}
                    className={
                      active
                        ? "rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                        : "rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                    }
                  >
                    {level}
                  </span>
                );
              })}
            </div>
            <div className="mt-4">
              {firstActiveLevel ? (
                <Link
                  href={`/app/practice/session?level=${firstActiveLevel}&skill=${skill.key}&mode=LEVEL&count=10`}
                >
                  <Button size="sm">Practice</Button>
                </Link>
              ) : (
                <Button size="sm" disabled>
                  Coming soon
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

