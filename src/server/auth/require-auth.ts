import "server-only";

import { redirect } from "next/navigation";
import { auth } from "@/server/auth/auth";

export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}
