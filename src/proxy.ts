import NextAuth from "next-auth";
import { authConfig } from "@/server/auth/auth.config";

const { auth } = NextAuth(authConfig);

export default auth;

export { auth as proxy };

export const config = {
  matcher: ["/app/:path*", "/login", "/register"],
};
