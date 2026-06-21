import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";

const userSelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      ticketsCreated: true,
      messages: true,
    },
  },
} as const;

export function parseUserRole(value: unknown): UserRole | null {
  if (value === "user" || value === "agent" || value === "admin") {
    return value;
  }
  return null;
}

export async function countAdmins() {
  return prisma.user.count({ where: { role: "admin" } });
}

export async function findManagedUser(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });
}

export async function listManagedUsers() {
  return prisma.user.findMany({
    select: userSelect,
    orderBy: [{ role: "asc" }, { fullName: "asc" }],
  });
}

export async function userHasTicketHistory(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      _count: {
        select: {
          ticketsCreated: true,
          messages: true,
          ticketsAssigned: true,
        },
      },
    },
  });

  if (!user) return false;

  const { ticketsCreated, messages, ticketsAssigned } = user._count;
  return ticketsCreated > 0 || messages > 0 || ticketsAssigned > 0;
}

export async function ensureNotLastAdmin(userId: string, nextRole?: UserRole) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user || user.role !== "admin") return null;

  const removingAdmin =
    nextRole !== undefined ? nextRole !== "admin" : true;

  if (!removingAdmin) return null;

  const adminCount = await countAdmins();
  if (adminCount <= 1) {
    return "Cannot remove the last admin account";
  }

  return null;
}

export { userSelect };
