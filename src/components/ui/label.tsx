import { cn } from "@/lib/utils";

type LabelProps = React.ComponentPropsWithoutRef<"label">;

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn("text-sm font-medium text-foreground", className)}
      {...props}
    />
  );
}
