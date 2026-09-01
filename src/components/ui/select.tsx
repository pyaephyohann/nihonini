import { cn } from "@/lib/utils";

type SelectProps = React.ComponentPropsWithoutRef<"select">;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "flex h-11 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
