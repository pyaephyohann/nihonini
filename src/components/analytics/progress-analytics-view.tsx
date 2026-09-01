import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/analytics/progress-bar";
import { SkillStatCard } from "@/components/analytics/skill-stat-card";
import type { LearningAnalytics } from "@/types/learning";

type ProgressAnalyticsViewProps = {
  analytics: LearningAnalytics;
};

export function ProgressAnalyticsView({ analytics }: ProgressAnalyticsViewProps) {
  if (!analytics.hasActivity) {
    return (
      <Card>
        <h2 className="text-xl font-semibold text-foreground">Progress overview</h2>
        <p className="mt-2 text-muted-foreground">
          Your progress is just getting started. Complete your first lesson or
          practice session to see your learning analytics.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/app/learn">
            <Button>Start learning</Button>
          </Link>
          <Link href="/app/practice">
            <Button variant="secondary">Start practice</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="text-xl font-semibold text-foreground">
          Progress overview
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <p className="text-sm text-muted-foreground">Average mastery</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {analytics.overall.masteryPercent}%
            </p>
          </Card>
          <Card>
            <p className="text-sm text-muted-foreground">Practice accuracy</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {analytics.practice.accuracy === null ? "—" : `${analytics.practice.accuracy}%`}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-muted-foreground">Recent accuracy</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {analytics.practice.recentAccuracy === null
                ? "—"
                : `${analytics.practice.recentAccuracy}%`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Last {analytics.practice.recentSampleSize} questions
            </p>
          </Card>
          <Card>
            <p className="text-sm text-muted-foreground">Lessons completed</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {analytics.overall.completedLessons} / {analytics.overall.totalLessons}
            </p>
          </Card>
        </div>
      </section>

      <section aria-labelledby="skills-heading">
        <h2 id="skills-heading" className="text-xl font-semibold text-foreground">
          Skill breakdown
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {analytics.jlpt.currentLevel} · average mastery across available content
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <SkillStatCard
            analytics={analytics.skills.vocabulary}
            level={analytics.jlpt.currentLevel}
          />
          <SkillStatCard
            analytics={analytics.skills.grammar}
            level={analytics.jlpt.currentLevel}
          />
          <SkillStatCard
            analytics={analytics.skills.kanji}
            level={analytics.jlpt.currentLevel}
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Reading and listening analytics will appear when those modules are implemented.
        </p>
      </section>

      <section aria-labelledby="jlpt-heading">
        <h2 id="jlpt-heading" className="text-xl font-semibold text-foreground">
          JLPT journey
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {analytics.jlpt.path.join(" → ")} · target path progress{" "}
          {analytics.jlpt.targetPathProgress}%
        </p>
        <div className="mt-4 space-y-3">
          {analytics.jlpt.levels.map((level) => (
            <div key={level.level} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground">
                    {level.level}
                    {level.isCurrent ? " · Current" : ""}
                    {level.isTarget ? " · Target" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {level.hasContent
                      ? `${level.completedLessons} / ${level.lessonCount} lessons`
                      : "No published content yet"}
                  </p>
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  {level.hasContent ? `${level.progressPercent}%` : "—"}
                </p>
              </div>
              {level.hasContent && (
                <div className="mt-3">
                  <ProgressBar
                    value={level.progressPercent}
                    label={`${level.level} average mastery`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="practice-heading">
        <h2 id="practice-heading" className="text-xl font-semibold text-foreground">
          Practice performance
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Total questions</dt>
                <dd className="text-lg font-semibold text-foreground">
                  {analytics.practice.totalQuestions}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Correct</dt>
                <dd className="text-lg font-semibold text-foreground">
                  {analytics.practice.correctAnswers}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Incorrect</dt>
                <dd className="text-lg font-semibold text-foreground">
                  {analytics.practice.incorrectAnswers}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Overall accuracy</dt>
                <dd className="text-lg font-semibold text-foreground">
                  {analytics.practice.accuracy === null
                    ? "—"
                    : `${analytics.practice.accuracy}%`}
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-muted-foreground">Recent accuracy trend</h3>
            {analytics.accuracyTrend.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Complete more practice to see your accuracy trend.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {analytics.accuracyTrend.map((point) => (
                  <li
                    key={point.day}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-muted-foreground">{point.label}</span>
                    <span className="font-medium text-foreground">
                      {point.accuracy}% ({point.total} questions)
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </section>

      <section aria-labelledby="insights-heading" className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 id="insights-heading" className="text-lg font-semibold text-foreground">
            Your strengths
          </h2>
          {analytics.strengths.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Complete more practice to identify your strongest skills.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {analytics.strengths.map((item, index) => (
                <li
                  key={item.skill}
                  className="rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span className="font-medium text-foreground">
                    {index === 0 ? "🥇" : "🥈"} {item.skill}
                  </span>
                  <span className="text-muted-foreground"> · {item.masteryPercent}% mastery</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-foreground">Needs practice</h2>
          {analytics.weaknesses.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Not enough practice data yet.
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
                      {item.masteryPercent}% mastery
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
      </section>

      <section aria-labelledby="activity-heading">
        <h2 id="activity-heading" className="text-xl font-semibold text-foreground">
          Recent activity
        </h2>
        {analytics.recentActivity.length === 0 ? (
          <Card className="mt-4">
            <p className="text-sm text-muted-foreground">No recent activity yet.</p>
          </Card>
        ) : (
          <div className="mt-4 space-y-3">
            {analytics.recentPracticeDays.length > 0 && (
              <Card>
                <h3 className="text-sm font-medium text-muted-foreground">Recent practice</h3>
                <ul className="mt-3 space-y-2">
                  {analytics.recentPracticeDays.map((day) => (
                    <li
                      key={day.day}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <span className="text-muted-foreground">{day.label}</span>
                      <span className="font-medium text-foreground">
                        {day.correctAnswers} / {day.totalQuestions} · {day.accuracy}%
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <Card>
              <h3 className="text-sm font-medium text-muted-foreground">Learning events</h3>
              <ul className="mt-3 space-y-2">
                {analytics.recentActivity.map((item) => (
                  <li key={`${item.type}-${item.occurredAt}-${item.label}`}>
                    <Link
                      href={item.href}
                      className="block rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}
      </section>
    </div>
  );
}
