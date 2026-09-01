import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/analytics/progress-bar";
import type { PracticeSkill, SkillAnalytics } from "@/types/learning";

const skillLabels: Record<PracticeSkill, string> = {
  VOCABULARY: "Vocabulary",
  GRAMMAR: "Grammar",
  KANJI: "Kanji",
};

type SkillStatCardProps = {
  analytics: SkillAnalytics;
  level: string;
  compact?: boolean;
};

export function SkillStatCard({ analytics, level, compact = false }: SkillStatCardProps) {
  const label = skillLabels[analytics.skill];

  return (
    <Card className={compact ? "p-4" : undefined}>
      <h3 className="text-sm font-semibold text-foreground">{label}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{level}</p>

      <div className="mt-4">
        <ProgressBar
          value={analytics.masteryPercent}
          label={`${label} average mastery`}
        />
      </div>

      {!compact && (
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Accuracy</dt>
            <dd className="font-semibold text-foreground">
              {analytics.accuracy === null ? "—" : `${analytics.accuracy}%`}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Mastered</dt>
            <dd className="font-semibold text-foreground">
              {analytics.itemsMastered} / {analytics.totalItems}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">In progress</dt>
            <dd className="font-semibold text-foreground">{analytics.itemsInProgress}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Due reviews</dt>
            <dd className="font-semibold text-foreground">{analytics.dueReviews}</dd>
          </div>
        </dl>
      )}

      {compact && (
        <p className="mt-3 text-sm text-muted-foreground">
          {analytics.itemsMastered} / {analytics.totalItems} mastered
        </p>
      )}

      <div className="mt-4">
        <Link
          href={`/app/practice/session?level=${level}&skill=${analytics.skill}&mode=WEAKNESS&count=10`}
        >
          <Button size="sm" variant="secondary">
            Practice {label.toLowerCase()}
          </Button>
        </Link>
      </div>
    </Card>
  );
}
