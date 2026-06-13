import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/api-client";

export async function GET() {
  try {
    await requireStaff();
  } catch {
    return jsonError("Forbidden", 403);
  }

  const staff = await prisma.user.findMany({
    where: { role: { in: ["admin", "agent"] } },
    select: { id: true, fullName: true, email: true, role: true },
    orderBy: { fullName: "asc" },
  });

  return jsonSuccess(staff);
}
