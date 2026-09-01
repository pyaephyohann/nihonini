import { updateDailyGoalAction } from "@/server/learning/progress.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DailyGoalFormProps = {
  currentGoal: number;
};

export function DailyGoalForm({ currentGoal }: DailyGoalFormProps) {
  return (
    <form action={updateDailyGoalAction} className="space-y-3">
      <Label htmlFor="daily-goal">Daily target (items)</Label>
      <div className="flex items-center gap-2">
        <Input
          id="daily-goal"
          name="dailyGoal"
          type="number"
          min={1}
          max={50}
          defaultValue={currentGoal}
          className="max-w-28"
        />
        <Button type="submit" size="sm" variant="secondary">
          Update
        </Button>
      </div>
    </form>
  );
}

