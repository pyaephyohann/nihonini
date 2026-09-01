import Link from "next/link";
import { requireAuth } from "@/server/auth/require-auth";
import { findSafeUserById } from "@/server/users/user.repository";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function AppDashboardPage() {
  const session = await requireAuth();
  const user = await findSafeUserById(session.user.id);

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
          <Link href="/app/learn">
            <Button>Start learning</Button>
          </Link>
        </div>
      </div>

      {user?.profile && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
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
              {user.profile.learningGoal.replaceAll("_", " ")}
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
