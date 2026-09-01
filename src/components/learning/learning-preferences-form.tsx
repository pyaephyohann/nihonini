"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  japaneseLevelValues,
  learningGoalValues,
} from "@/lib/validations/auth";
import {
  updateLearningPreferencesSchema,
  type UpdateLearningPreferencesInput,
} from "@/lib/validations/profile";
import { updateLearningPreferencesAction } from "@/server/users/preferences.actions";

const learningGoalLabels: Record<(typeof learningGoalValues)[number], string> = {
  JLPT: "JLPT preparation",
  STUDY: "Study in Japan",
  WORK: "Work in Japan",
  TRAVEL: "Travel",
  LIFE_IN_JAPAN: "Life in Japan",
};

type LearningPreferencesFormProps = {
  defaults: {
    japaneseLevel: (typeof japaneseLevelValues)[number];
    targetJlptLevel: (typeof japaneseLevelValues)[number];
    learningGoal: (typeof learningGoalValues)[number];
    dailyGoal: number;
  };
};

export function LearningPreferencesForm({ defaults }: LearningPreferencesFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateLearningPreferencesInput>({
    resolver: zodResolver(updateLearningPreferencesSchema),
    defaultValues: defaults,
  });

  const onSubmit = (data: UpdateLearningPreferencesInput) => {
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("japaneseLevel", data.japaneseLevel);
      formData.set("targetJlptLevel", data.targetJlptLevel);
      formData.set("learningGoal", data.learningGoal);
      formData.set("dailyGoal", String(data.dailyGoal));

      const result = await updateLearningPreferencesAction({}, formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(true);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="japaneseLevel">Current level</Label>
          <Select id="japaneseLevel" {...register("japaneseLevel")}>
            {japaneseLevelValues.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </Select>
          {errors.japaneseLevel && (
            <p className="text-sm text-error">{errors.japaneseLevel.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetJlptLevel">JLPT target</Label>
          <Select id="targetJlptLevel" {...register("targetJlptLevel")}>
            {japaneseLevelValues.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </Select>
          {errors.targetJlptLevel && (
            <p className="text-sm text-error">{errors.targetJlptLevel.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="learningGoal">Learning goal</Label>
          <Select id="learningGoal" {...register("learningGoal")}>
            {learningGoalValues.map((goal) => (
              <option key={goal} value={goal}>
                {learningGoalLabels[goal]}
              </option>
            ))}
          </Select>
          {errors.learningGoal && (
            <p className="text-sm text-error">{errors.learningGoal.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dailyGoal">Daily goal (items)</Label>
          <Input
            id="dailyGoal"
            type="number"
            min={1}
            max={50}
            {...register("dailyGoal", { valueAsNumber: true })}
          />
          {errors.dailyGoal && (
            <p className="text-sm text-error">{errors.dailyGoal.message}</p>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}
      {success && <p className="text-sm text-success">Preferences saved.</p>}

      <Button type="submit" variant="secondary" disabled={isPending}>
        {isPending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}

