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
    <div className="min-h-full bg-background">
      <header className="border-b border-border bg-secondary">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/app"
            className="flex items-center gap-2 text-lg font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
          >
            <span
              aria-hidden="true"
              className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
            >
              日
            </span>
            Nihonini
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/app/learn"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
            >
              Learn
            </Link>
            <Link
              href="/app/practice"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
            >
              Practice
            </Link>
            <Link
              href="/app/exams"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
            >
              Exams
            </Link>
            <Link
              href="/app/progress"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
            >
              Progress
            </Link>
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {session.user.email}
            </span>
            <form action={logoutAction}>
              <Button type="submit" variant="secondary" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
