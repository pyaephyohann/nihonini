"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { loginSchema } from "@/lib/validations/auth";
import { signIn, signOut } from "@/server/auth/auth";
import { registerUser } from "@/server/users/user.service";
import type { RegisterInput } from "@/lib/validations/auth";

export type AuthActionState = {
  error?: string;
};

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid login data.";
    return { error: firstError };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirectTo: "/app",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }

    throw error;
  }

  return {};
}

export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const input: RegisterInput = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
    displayName: String(formData.get("displayName") ?? ""),
    japaneseLevel: String(formData.get("japaneseLevel") ?? "") as RegisterInput["japaneseLevel"],
    learningGoal: String(formData.get("learningGoal") ?? "") as RegisterInput["learningGoal"],
  };

  const result = await registerUser(input);

  if (!result.success) {
    return { error: result.error };
  }

  redirect("/app");
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
