import Link from "next/link";
import { Card } from "@/components/ui/card";

type AuthShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
};

export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <header className="border-b border-border bg-secondary px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-lg font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
        >
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
          >
            日
          </span>
          Nihonini
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>

          <Card>{children}</Card>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {footer}
          </div>
        </div>
      </main>
    </div>
  );
}
