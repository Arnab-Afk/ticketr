import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError, jsonSuccess } from "@/lib/api-client";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const body = await request.json();
    const currentPassword = String(body.currentPassword ?? "");
    const newPassword = String(body.newPassword ?? "");

    if (!currentPassword || !newPassword) {
      return jsonError("Current password and new password are required");
    }

    if (newPassword.length < 6) {
      return jsonError("New password must be at least 6 characters");
    }

    if (currentPassword === newPassword) {
      return jsonError("New password must be different from the current password");
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      return jsonError(
        "This account uses social sign-in. Set a password by registering with email instead."
      );
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return jsonError("Current password is incorrect");
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash },
    });

    return jsonSuccess({ updated: true });
  } catch {
    return jsonError("Failed to update password", 500);
  }
}
