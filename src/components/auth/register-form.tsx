"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  japaneseLevelValues,
  learningGoalValues,
  registerSchema,
  type RegisterInput,
} from "@/lib/validations/auth";
import { registerAction } from "@/server/auth/actions";

const learningGoalLabels: Record<(typeof learningGoalValues)[number], string> = {
  JLPT: "JLPT preparation",
  STUDY: "Study in Japan",
  WORK: "Work in Japan",
  TRAVEL: "Travel",
  LIFE_IN_JAPAN: "Life in Japan",
};

export function RegisterForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      displayName: "",
      japaneseLevel: "N5",
      learningGoal: "JLPT",
    },
  });

  const onSubmit = (data: RegisterInput) => {
    setServerError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("email", data.email);
      formData.set("password", data.password);
      formData.set("confirmPassword", data.confirmPassword);
      formData.set("displayName", data.displayName);
      formData.set("japaneseLevel", data.japaneseLevel);
      formData.set("learningGoal", data.learningGoal);

      const result = await registerAction({}, formData);

      if (result?.error) {
        setServerError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          autoComplete="name"
          aria-invalid={!!errors.displayName}
          {...register("displayName")}
        />
        {errors.displayName && (
          <p className="text-sm text-error" role="alert">
            {errors.displayName.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-error" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-error" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.confirmPassword}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-error" role="alert">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="japaneseLevel">Japanese level</Label>
        <Select id="japaneseLevel" {...register("japaneseLevel")}>
          {japaneseLevelValues.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </Select>
        {errors.japaneseLevel && (
          <p className="text-sm text-error" role="alert">
            {errors.japaneseLevel.message}
          </p>
        )}
      </div>

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
          <p className="text-sm text-error" role="alert">
            {errors.learningGoal.message}
          </p>
        )}
      </div>

      {serverError && (
        <p className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error" role="alert">
          {serverError}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creating account..." : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
