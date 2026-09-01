type PracticeProgressProps = {
  current: number;
  total: number;
};

export function PracticeProgress({ current, total }: PracticeProgressProps) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">
        Question {Math.min(current + 1, total)} / {total}
      </p>
      <div className="mt-2 h-2 w-full rounded-full bg-muted">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{percent}% complete</p>
    </div>
  );
}

