import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/server/auth/require-auth";
import {
  getPracticeAvailabilityMatrix,
  getPracticeDefaults,
  getWeakSkillRecommendations,
} from "@/server/learning/practice-session.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PracticeConfigForm } from "@/components/practice/practice-config-form";
import { PracticeSkillCards } from "@/components/practice/practice-skill-cards";

export const metadata: Metadata = {
  title: "Practice",
};

export default async function PracticePage() {
  const session = await requireAuth();
  const [defaults, availability, weakness] = await Promise.all([
    getPracticeDefaults(session.user.id),
    getPracticeAvailabilityMatrix(),
    getWeakSkillRecommendations(session.user.id),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <p className="font-display text-xl text-muted-foreground">練習しましょう</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          Practice Japanese
        </h1>
        <p className="mt-3 text-muted-foreground">
          Build a focused JLPT practice session by level, skill, and mode.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Recommended path: {defaults.path.join(" → ")}
        </p>
      </div>

      <div className="mt-4">
        <Link href="/app">
          <Button variant="ghost" size="sm">
            ← Back to dashboard
          </Button>
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <PracticeConfigForm
            defaults={{
              level: defaults.level,
              skill: defaults.skill,
              mode: defaults.mode,
              questionCount: defaults.questionCount,
            }}
            availability={availability}
          />
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-foreground">
            Practice your weakest skills
          </h2>
          <div className="mt-3 space-y-3">
            {weakness.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Not enough practice data yet. Complete a few exercises and we&apos;ll
                identify your weak areas.
              </p>
            ) : (
              weakness.map((item) => (
                <div key={item.skill} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-medium text-foreground">{item.skill}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.level} · Mastery {item.masteryPercent}%
                  </p>
                  <div className="mt-2">
                    <Link
                      href={`/app/practice/session?level=${item.level}&skill=${item.skill}&mode=WEAKNESS&count=10`}
                    >
                      <Button size="sm" variant="secondary">
                        Practice {item.skill.toLowerCase()}
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">Practice by skill</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a skill directly. Levels with content are active.
        </p>
        <div className="mt-4">
          <PracticeSkillCards availability={availability} />
        </div>
      </section>
    </div>
  );
}

