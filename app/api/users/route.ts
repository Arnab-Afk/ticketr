import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/api-client";
import { listManagedUsers, parseUserRole, userSelect } from "@/lib/user-admin";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return jsonError("Forbidden", 403);
  }

  const users = await listManagedUsers();
  return jsonSuccess(users);
}

export async function POST(request: Request) {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return jsonError("Forbidden", 403);
  }

  try {
    const body = await request.json();
    const email = String(body.email ?? "").toLowerCase().trim();
    const password = String(body.password ?? "");
    const fullName = String(body.fullName ?? "").trim();
    const role = parseUserRole(body.role) ?? "user";

    if (!email || !password || !fullName) {
      return jsonError("Full name, email, and password are required");
    }

    if (password.length < 6) {
      return jsonError("Password must be at least 6 characters");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return jsonError("A user with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role,
      },
      select: userSelect,
    });

    console.info(
      `[users] admin ${session.user.email} created user ${user.email} (${user.role})`
    );

    return jsonSuccess(user, 201);
  } catch {
    return jsonError("Failed to create user", 500);
  }
}
