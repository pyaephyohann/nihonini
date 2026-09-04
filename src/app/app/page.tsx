import Link from "next/link";
import { requireAuth } from "@/server/auth/require-auth";
import { findSafeUserById } from "@/server/users/user.repository";
import { buildDashboardViewModel } from "@/server/dashboard/dashboard-view-model.service";
import { buildContinueLearningHref } from "@/lib/dashboard/dashboard-view-model";
import { getUserLearningAnalytics } from "@/server/learning/analytics.service";
import { getLatestMockExamSummary } from "@/server/learning/mock-exam.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LearningPreferencesForm } from "@/components/learning/learning-preferences-form";
import { LearningOverview } from "@/components/analytics/learning-overview";
import { DashboardNextActionSection } from "@/components/dashboard/dashboard-next-action";

export default async function AppDashboardPage() {
  const session = await requireAuth();
  const user = await findSafeUserById(session.user.id);
  const dashboardViewModel = await buildDashboardViewModel(session.user.id);
  const dashboard = dashboardViewModel.snapshot;
  const { nextAction } = dashboardViewModel;
  const analytics = await getUserLearningAnalytics(session.user.id);
  const latestMockExam = await getLatestMockExamSummary(session.user.id);
  const continueHref = buildContinueLearningHref(dashboard.continueLearning);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <p className="font-display text-xl text-muted-foreground">
          おかえりなさい
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          Welcome{user?.profile?.displayName ? `, ${user.profile.displayName}` : ""}
        </h1>
        <p className="mt-3 text-muted-foreground">
          Continue your Japanese learning journey with structured JLPT-aligned
          lessons.
        </p>
        <DashboardNextActionSection action={nextAction} />
      </div>

      {user?.profile && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <h2 className="text-sm font-medium text-muted-foreground">
              Japanese level
            </h2>
            <p className="mt-1 font-japanese text-2xl font-bold text-foreground">
              {user.profile.japaneseLevel}
            </p>
          </Card>
          <Card>
            <h2 className="text-sm font-medium text-muted-foreground">
              Learning goal
            </h2>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {dashboard.learnerGoal.learningGoal.replaceAll("_", " ")}
            </p>
          </Card>
          <Card>
            <h2 className="text-sm font-medium text-muted-foreground">
              Current streak
            </h2>
            <p className="mt-1 text-2xl font-bold text-foreground">
              🔥 {dashboard.streakDays} day{dashboard.streakDays === 1 ? "" : "s"}
            </p>
          </Card>
          <Card>
            <h2 className="text-sm font-medium text-muted-foreground">
              Today&apos;s goal
            </h2>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {dashboard.dailyProgress.completed} / {dashboard.dailyProgress.target}
            </p>
            <div className="mt-3 h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${dashboard.dailyProgress.percentage}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {dashboard.dailyProgress.percentage}%
            </p>
          </Card>
          <Link
            href="/app/review"
            className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Card className="transition-colors hover:bg-muted/40">
              <h2 className="text-sm font-medium text-muted-foreground">Due reviews</h2>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {dashboard.dueReviews.total}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Vocab {dashboard.dueReviews.vocabulary} · Grammar{" "}
                {dashboard.dueReviews.grammar} · Kanji {dashboard.dueReviews.kanji}
              </p>
              {dashboard.dueReviews.total > 0 && (
                <p className="mt-2 text-xs font-medium text-primary">Review now →</p>
              )}
            </Card>
          </Link>
          <Card className="sm:col-span-2 lg:col-span-2">
            <h2 className="text-sm font-medium text-muted-foreground">
              Continue learning
            </h2>
            <p className="mt-1 text-xl font-bold text-foreground">
              {dashboard.continueLearning.lessonTitle ?? "Start your first lesson"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {dashboard.continueLearning.progressPercent}% progress
            </p>
            <div className="mt-3">
              <Link href={continueHref}>
                <Button size="sm">Continue</Button>
              </Link>
            </div>
          </Card>
          <Card className="sm:col-span-2 lg:col-span-3">
            <h2 className="text-sm font-medium text-muted-foreground">🎯 JLPT goal</h2>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {dashboard.learnerGoal.targetLevel}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {dashboard.jlptPath.join(" → ")}
            </p>
            <div className="mt-3 h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${dashboard.jlptPreparationProgress}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Preparation progress: {dashboard.jlptPreparationProgress}% · Vocab{" "}
              {dashboard.jlptSkillProgress.vocabulary}% · Grammar{" "}
              {dashboard.jlptSkillProgress.grammar}% · Kanji{" "}
              {dashboard.jlptSkillProgress.kanji}%
              {dashboard.jlptSkillProgress.reading !== null &&
                ` · Reading ${dashboard.jlptSkillProgress.reading}%`}
              {dashboard.jlptSkillProgress.listening !== null &&
                ` · Listening ${dashboard.jlptSkillProgress.listening}%`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Skill progress reflects published content at your target level.
            </p>
          </Card>
          <Card className="sm:col-span-2 lg:col-span-3">
            <LearningOverview analytics={analytics} />
          </Card>
          {latestMockExam && (
            <Card className="sm:col-span-2 lg:col-span-2">
              <h2 className="text-sm font-medium text-muted-foreground">Latest mock exam</h2>
              <p className="mt-1 text-xl font-bold text-foreground">{latestMockExam.examTitle}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {latestMockExam.jlptLevel} · {latestMockExam.scorePercent}% mock exam score
              </p>
              <div className="mt-3">
                <Link href={`/app/exams/result/${latestMockExam.sessionId}`}>
                  <Button size="sm" variant="secondary">
                    View result
                  </Button>
                </Link>
              </div>
            </Card>
          )}
          <Card className="sm:col-span-2 lg:col-span-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              Learning preferences
            </h2>
            <div className="mt-3">
              <LearningPreferencesForm
                defaults={{
                  japaneseLevel: user.profile.japaneseLevel,
                  targetJlptLevel:
                    user.profile.targetJlptLevel ?? user.profile.japaneseLevel,
                  learningGoal: user.profile.learningGoal,
                  dailyGoal: user.profile.dailyGoal,
                }}
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
