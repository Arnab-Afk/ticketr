import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/api-client";
import {
  ensureNotLastAdmin,
  findManagedUser,
  parseUserRole,
  userHasTicketHistory,
  userSelect,
} from "@/lib/user-admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return jsonError("Forbidden", 403);
  }

  const { id } = await context.params;

  try {
    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true },
    });

    if (!existing) {
      return jsonError("User not found", 404);
    }

    const body = await request.json();
    const data: {
      fullName?: string;
      email?: string;
      role?: "user" | "agent" | "admin";
      passwordHash?: string;
    } = {};

    if (body.fullName !== undefined) {
      const fullName = String(body.fullName).trim();
      if (!fullName) return jsonError("Full name is required");
      data.fullName = fullName;
    }

    if (body.email !== undefined) {
      const email = String(body.email).toLowerCase().trim();
      if (!email) return jsonError("Email is required");
      if (email !== existing.email) {
        const duplicate = await prisma.user.findUnique({ where: { email } });
        if (duplicate) return jsonError("A user with this email already exists");
      }
      data.email = email;
    }

    if (body.role !== undefined) {
      const role = parseUserRole(body.role);
      if (!role) return jsonError("Invalid role");
      const lastAdminError = await ensureNotLastAdmin(id, role);
      if (lastAdminError) return jsonError(lastAdminError);
      data.role = role;
    }

    if (body.password !== undefined && body.password !== "") {
      const password = String(body.password);
      if (password.length < 6) {
        return jsonError("Password must be at least 6 characters");
      }
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    if (Object.keys(data).length === 0) {
      return jsonError("No changes provided");
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });

    console.info(
      `[users] admin ${session.user.email} updated user ${user.email}`
    );

    return jsonSuccess(user);
  } catch {
    return jsonError("Failed to update user", 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return jsonError("Forbidden", 403);
  }

  const { id } = await context.params;

  if (id === session.user.id) {
    return jsonError("You cannot delete your own account", 400);
  }

  try {
    const existing = await findManagedUser(id);
    if (!existing) {
      return jsonError("User not found", 404);
    }

    const lastAdminError = await ensureNotLastAdmin(id);
    if (lastAdminError) return jsonError(lastAdminError);

    if (await userHasTicketHistory(id)) {
      return jsonError(
        "This user has ticket history. Reassign or close their tickets before deleting.",
        400
      );
    }

    await prisma.user.delete({ where: { id } });

    console.info(
      `[users] admin ${session.user.email} deleted user ${existing.email}`
    );

    return jsonSuccess({ id });
  } catch {
    return jsonError("Failed to delete user", 500);
  }
}
