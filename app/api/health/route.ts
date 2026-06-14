import { prisma } from "@/lib/db";
import { isEmailConfigured } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({
      status: "ok",
      email: isEmailConfigured() ? "configured" : "disabled",
    });
  } catch {
    return Response.json(
      { status: "degraded", database: "unavailable", email: isEmailConfigured() ? "configured" : "disabled" },
      { status: 503 }
    );
  }
}
