import "server-only";

import bcrypt from "bcrypt";
import { AuthError } from "next-auth";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { signIn } from "@/server/auth/auth";
import {
  createUserWithProfile,
  findUserByEmail,
} from "@/server/users/user.repository";

const BCRYPT_ROUNDS = 12;

export type RegisterResult =
  | { success: true }
  | { success: false; error: string };

export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid registration data.";
    return { success: false, error: firstError };
  }

  const data = parsed.data;
  const normalizedEmail = data.email.toLowerCase();

  const existingUser = await findUserByEmail(normalizedEmail);

  if (existingUser) {
    return { success: false, error: "Email is already registered." };
  }

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

  try {
    await createUserWithProfile({
      email: normalizedEmail,
      passwordHash,
      displayName: data.displayName,
      japaneseLevel: data.japaneseLevel,
      learningGoal: data.learningGoal,
    });
  } catch {
    return { success: false, error: "Unable to create account. Please try again." };
  }

  try {
    await signIn("credentials", {
      email: normalizedEmail,
      password: data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: "Account created but sign-in failed. Please log in." };
    }

    throw error;
  }

  return { success: true };
}
