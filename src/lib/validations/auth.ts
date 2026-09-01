import { z } from "zod";

export const japaneseLevelValues = ["N5", "N4", "N3", "N2", "N1"] as const;

export const learningGoalValues = [
  "JLPT",
  "STUDY",
  "WORK",
  "TRAVEL",
  "LIFE_IN_JAPAN",
] as const;

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password must be at most 128 characters.");

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export const registerSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "Email is required.")
      .email("Please enter a valid email address."),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password."),
    displayName: z
      .string()
      .trim()
      .min(1, "Display name is required.")
      .max(100, "Display name must be at most 100 characters."),
    japaneseLevel: z.enum(japaneseLevelValues, {
      error: "Please select a valid Japanese level.",
    }),
    targetJlptLevel: z
      .enum(japaneseLevelValues, {
        error: "Please select a valid target JLPT level.",
      })
      .optional(),
    learningGoal: z.enum(learningGoalValues, {
      error: "Please select a valid learning goal.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
