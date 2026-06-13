import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

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

export function isStaff(role: string) {
  return role === "admin" || role === "agent";
}
