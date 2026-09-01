import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to continue your Japanese learning journey."
      footer={
        <>
          <Link
            href="/"
            className="font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
          >
            Back to home
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
