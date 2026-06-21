import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import type { Provider } from "next-auth/providers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";
import type { UserRole } from "@/lib/types/user";
import { getUserByAccessToken } from "@/lib/user-access-token";

const providers: Provider[] = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
      accessToken: { label: "Access Token", type: "text" },
    },
    async authorize(credentials) {
      if (credentials?.accessToken) {
        const user = await getUserByAccessToken(String(credentials.accessToken));
        if (!user) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role as UserRole,
          image: user.avatarUrl,
        };
      }

      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      const email = String(credentials.email).toLowerCase().trim();
      const password = String(credentials.password);

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.passwordHash) return null;

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.fullName,
        role: user.role as UserRole,
        image: user.avatarUrl,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (!account || account.provider === "credentials") return true;
      if (!user.email) return false;

      const email = user.email.toLowerCase();
      let dbUser = await prisma.user.findUnique({ where: { email } });

      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            email,
            fullName: user.name ?? email.split("@")[0],
            avatarUrl: user.image,
          },
        });
      } else if (user.image && !dbUser.avatarUrl) {
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { avatarUrl: user.image },
        });
      }

      await prisma.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        },
        create: {
          userId: dbUser.id,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token,
          access_token: account.access_token,
          expires_at: account.expires_at,
          token_type: account.token_type,
          scope: account.scope,
          id_token: account.id_token,
        },
        update: {
          refresh_token: account.refresh_token,
          access_token: account.access_token,
          expires_at: account.expires_at,
        },
      });

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        if (user.id && user.role) {
          token.sub = user.id;
          token.id = user.id;
          token.role = user.role;
          token.name = user.name;
          token.email = user.email;
          token.picture = user.image;
        } else if (user.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email.toLowerCase() },
          });
          if (dbUser) {
            token.sub = dbUser.id;
            token.id = dbUser.id;
            token.role = dbUser.role as UserRole;
            token.name = dbUser.fullName;
            token.email = dbUser.email;
            token.picture = dbUser.avatarUrl ?? user.image;
          }
        }
      }
      return token;
    },
  },
});

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireStaff() {
  const session = await requireSession();
  const role = session.user.role;
  if (role !== "admin" && role !== "agent") {
    throw new Error("Forbidden");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== "admin") {
    throw new Error("Forbidden");
  }
  return session;
}

export function isStaff(role: string) {
  return role === "admin" || role === "agent";
}
