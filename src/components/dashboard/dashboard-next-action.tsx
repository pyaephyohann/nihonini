import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  DashboardActionSource,
  DashboardNextAction,
} from "@/lib/dashboard/dashboard-view-model";

type DashboardNextActionProps = {
  action: DashboardNextAction;
};

function ctaLabel(source: DashboardActionSource): string {
  switch (source) {
    case "REVIEW":
      return "Start Review";
    case "WEAKNESS":
      return "Practice Weakness";
    case "CONTINUE":
      return "Continue Learning";
    case "FALLBACK":
      return "Start Learning";
  }
}

export function DashboardNextActionSection({ action }: DashboardNextActionProps) {
  return (
    <section
      aria-labelledby="dashboard-next-step-heading"
      className="mt-6 min-w-0 max-w-2xl"
    >
      <Card className="border-primary/25 bg-card p-5 sm:p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Your next step
        </p>
        <h2
          id="dashboard-next-step-heading"
          className="mt-2 text-xl font-semibold text-foreground"
        >
          {action.title}
        </h2>
        <p className="mt-2 text-sm text-foreground">{action.context}</p>
        {action.description ? (
          <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
        ) : null}
        <div className="mt-4">
          <Link
            href={action.href}
            className="inline-block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Button type="button">{ctaLabel(action.source)}</Button>
          </Link>
        </div>
      </Card>
    </section>
  );
}
