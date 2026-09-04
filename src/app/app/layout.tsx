import type { Metadata } from "next";
import Link from "next/link";
import { logoutAction } from "@/server/auth/actions";
import { requireAuth } from "@/server/auth/require-auth";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireAuth();

  return (
    <div className="min-h-full min-w-0 bg-background">
      <header className="border-b border-border bg-secondary">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <Link
            href="/app"
            className="flex shrink-0 items-center gap-2 rounded-sm text-lg font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <span
              aria-hidden="true"
              className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
            >
              日
            </span>
            Nihonini
          </Link>

          <nav
            aria-label="Main"
            className="flex min-w-0 flex-wrap items-center justify-end gap-x-2 gap-y-1 sm:gap-x-3"
          >
            <Link
              href="/app/learn"
              className="rounded-sm text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:text-sm"
            >
              Learn
            </Link>
            <Link
              href="/app/practice"
              className="rounded-sm text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:text-sm"
            >
              Practice
            </Link>
            <Link
              href="/app/review"
              className="rounded-sm text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:text-sm"
            >
              Review
            </Link>
            <Link
              href="/app/exams"
              className="rounded-sm text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:text-sm"
            >
              Exams
            </Link>
            <Link
              href="/app/progress"
              className="rounded-sm text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:text-sm"
            >
              Progress
            </Link>
            <Link
              href="/app/tutor"
              className="rounded-sm text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:text-sm"
            >
              Tutor
            </Link>
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {session.user.email}
            </span>
            <form action={logoutAction}>
              <Button type="submit" variant="secondary" size="sm">
                Sign out
              </Button>
            </form>
          </nav>
        </div>
      </header>

      <main className="min-w-0">{children}</main>
    </div>
  );
}
