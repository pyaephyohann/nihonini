import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/analytics/progress-bar";
import { SkillStatCard } from "@/components/analytics/skill-stat-card";
import type { LearningAnalytics } from "@/types/learning";

type LearningOverviewProps = {
  analytics: LearningAnalytics;
};

export function LearningOverview({ analytics }: LearningOverviewProps) {
  if (!analytics.hasActivity) {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-foreground">Your learning overview</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your progress is just getting started. Complete your first lesson or
          practice session to see your learning analytics.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/app/learn">
            <Button size="sm">Start learning</Button>
          </Link>
          <Link href="/app/practice">
            <Button size="sm" variant="secondary">
              Start practice
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Your learning overview</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {analytics.jlpt.currentLevel} → {analytics.jlpt.targetLevel}
            </p>
          </div>
          <Link href="/app/progress">
            <Button size="sm" variant="secondary">
              View progress
            </Button>
          </Link>
        </div>

        <div className="mt-4">
          <ProgressBar
            value={analytics.jlpt.targetPathProgress}
            label={`JLPT path progress (${analytics.jlpt.path.join(" → ")})`}
          />
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          Average mastery on target path: {analytics.jlpt.targetPathProgress}% · Lessons{" "}
          {analytics.overall.completedLessons} / {analytics.overall.totalLessons}
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SkillStatCard
          analytics={analytics.skills.vocabulary}
          level={analytics.jlpt.currentLevel}
          compact
        />
        <SkillStatCard
          analytics={analytics.skills.grammar}
          level={analytics.jlpt.currentLevel}
          compact
        />
        <SkillStatCard
          analytics={analytics.skills.kanji}
          level={analytics.jlpt.currentLevel}
          compact
        />
        {analytics.skills.reading && (
          <SkillStatCard
            analytics={analytics.skills.reading}
            level={analytics.jlpt.currentLevel}
            compact
          />
        )}
        {analytics.skills.listening && (
          <SkillStatCard
            analytics={analytics.skills.listening}
            level={analytics.jlpt.currentLevel}
            compact
          />
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="text-sm font-medium text-muted-foreground">Practice performance</h3>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {analytics.practice.recentAccuracy === null
              ? "—"
              : `${analytics.practice.recentAccuracy}%`}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Recent accuracy (last {analytics.practice.recentSampleSize} questions)
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Overall:{" "}
            {analytics.practice.accuracy === null
              ? "No attempts yet"
              : `${analytics.practice.accuracy}% (${analytics.practice.correctAnswers} / ${analytics.practice.totalQuestions})`}
          </p>
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-muted-foreground">Needs practice</h3>
          {analytics.weaknesses.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Complete a few exercises and we&apos;ll identify your weak areas.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {analytics.weaknesses.map((item) => (
                <li
                  key={item.skill}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.skill}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.level} · {item.masteryPercent}% mastery
                    </p>
                  </div>
                  <Link
                    href={`/app/practice/session?level=${item.level}&skill=${item.skill}&mode=WEAKNESS&count=10`}
                  >
                    <Button size="sm" variant="secondary">
                      Practice
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {analytics.recentActivity.length > 0 && (
        <Card>
          <h3 className="text-sm font-medium text-muted-foreground">Recent activity</h3>
          <ul className="mt-3 space-y-2">
            {analytics.recentActivity.slice(0, 4).map((item) => (
              <li key={`${item.type}-${item.occurredAt}-${item.label}`}>
                <Link
                  href={item.href}
                  className="block rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-muted"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
