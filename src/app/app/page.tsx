import Link from "next/link";
import { requireAuth } from "@/server/auth/require-auth";
import { findSafeUserById } from "@/server/users/user.repository";
import { getDashboardSnapshot } from "@/server/learning/daily-learning.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LearningPreferencesForm } from "@/components/learning/learning-preferences-form";

export default async function AppDashboardPage() {
  const session = await requireAuth();
  const [user, dashboard] = await Promise.all([
    findSafeUserById(session.user.id),
    getDashboardSnapshot(session.user.id),
  ]);

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
        <div className="mt-6">
          <Link href={dashboard.continueLearning.lessonSlug ? `/app/learn/${dashboard.continueLearning.lessonSlug}` : "/app/learn"}>
            <Button>Start learning</Button>
          </Link>
        </div>
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
          <Card>
            <h2 className="text-sm font-medium text-muted-foreground">Due reviews</h2>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {dashboard.dueReviews.total}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Vocab {dashboard.dueReviews.vocabulary} · Grammar {dashboard.dueReviews.grammar} · Kanji {dashboard.dueReviews.kanji}
            </p>
          </Card>
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
              <Link href={dashboard.continueLearning.lessonSlug ? `/app/learn/${dashboard.continueLearning.lessonSlug}` : "/app/learn"}>
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
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Reading and listening progress will appear when those modules are
              implemented.
            </p>
          </Card>
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
