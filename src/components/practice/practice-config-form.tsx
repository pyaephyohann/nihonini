"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  practiceConfigSchema,
  practiceModeValues,
  practiceQuestionCountValues,
  practiceSkillValues,
  type PracticeConfigInput,
} from "@/lib/validations/practice";
import { japaneseLevelValues } from "@/lib/validations/auth";

type PracticeConfigFormProps = {
  defaults: PracticeConfigInput;
  availability: Record<
    "N5" | "N4" | "N3" | "N2" | "N1",
    { VOCABULARY: number; GRAMMAR: number; KANJI: number }
  >;
};

const skillLabels: Record<(typeof practiceSkillValues)[number], string> = {
  VOCABULARY: "Vocabulary",
  GRAMMAR: "Grammar",
  KANJI: "Kanji",
};

const modeLabels: Record<(typeof practiceModeValues)[number], string> = {
  REVIEW: "Review",
  WEAKNESS: "Weakness",
  LEVEL: "Level",
};

export function PracticeConfigForm({
  defaults,
  availability,
}: PracticeConfigFormProps) {
  const router = useRouter();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PracticeConfigInput>({
    resolver: zodResolver(practiceConfigSchema),
    defaultValues: defaults,
  });

  const level = useWatch({ control, name: "level" });
  const skill = useWatch({ control, name: "skill" });
  const availableCount = level && skill ? availability[level][skill] : 0;

  const onSubmit = (values: PracticeConfigInput) => {
    const params = new URLSearchParams({
      level: values.level,
      skill: values.skill,
      mode: values.mode,
      count: String(values.questionCount),
    });
    router.push(`/app/practice/session?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="level">JLPT level</Label>
        <Select id="level" {...register("level")}>
          {japaneseLevelValues.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="skill">Skill</Label>
        <Select id="skill" {...register("skill")}>
          {practiceSkillValues.map((value) => (
            <option key={value} value={value}>
              {skillLabels[value]}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mode">Practice mode</Label>
        <Select id="mode" {...register("mode")}>
          {practiceModeValues.map((value) => (
            <option key={value} value={value}>
              {modeLabels[value]}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="questionCount">Questions</Label>
        <Select
          id="questionCount"
          {...register("questionCount", { valueAsNumber: true })}
        >
          {practiceQuestionCountValues.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">
        Available for selection: {availableCount} questions
      </p>

      {errors.root?.message && (
        <p className="text-sm text-error">{errors.root.message}</p>
      )}

      <Button type="submit" className="w-full sm:w-auto">
        Start practice
      </Button>
    </form>
  );
}

