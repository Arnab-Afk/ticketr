import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { jsonError, jsonSuccess } from "@/lib/api-client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").toLowerCase().trim();
    const password = String(body.password ?? "");
    const fullName = String(body.fullName ?? "").trim();

    if (!email || !password || !fullName) {
      return jsonError("Email, password, and full name are required");
    }

    if (password.length < 6) {
      return jsonError("Password must be at least 6 characters");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return jsonError("An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, fullName },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });

    return jsonSuccess(user, 201);
  } catch {
    return jsonError("Failed to create account", 500);
  }
}
