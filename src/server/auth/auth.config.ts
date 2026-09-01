import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const path = nextUrl.pathname;
      const isProtected = path.startsWith("/app");
      const isAuthPage = path === "/login" || path === "/register";

      if (isProtected) {
        return !!auth?.user;
      }

      if (isAuthPage && auth?.user) {
        return Response.redirect(new URL("/app", nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
} satisfies NextAuthConfig;
