import { cn } from "@/lib/utils";

type ProgressBarProps = {
  value: number;
  label: string;
  className?: string;
};

export function ProgressBar({ value, label, className }: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">{percent}%</span>
      </div>
      <div
        className="h-2 w-full rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={label}
      >
        <div
          className="h-2 rounded-full bg-primary transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
