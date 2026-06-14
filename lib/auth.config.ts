import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@/lib/types/user";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      image?: string | null;
    };
  }

  interface User {
    role: UserRole;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}

/** Edge-safe auth config — no Prisma. Used by middleware. */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id ?? token.sub;
        token.id = user.id ?? token.id;
        token.role = user.role ?? token.role;
        token.name = user.name ?? token.name;
        token.email = user.email ?? token.email;
        token.picture = user.image ?? token.picture;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id ?? token.sub) as string;
        session.user.role = token.role as UserRole;
        session.user.email = token.email!;
        session.user.name = token.name!;
        session.user.image = token.picture;
      }
      return session;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
