import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create account",
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="Start learning Japanese"
      description="Create your Nihonini account and set your learning goals."
      footer={
        <Link
          href="/"
          className="font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
        >
          Back to home
        </Link>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
