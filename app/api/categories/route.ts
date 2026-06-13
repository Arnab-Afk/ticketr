import { prisma } from "@/lib/db";
import { jsonSuccess } from "@/lib/api-client";

export async function GET() {
  const categories = await prisma.ticketCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return jsonSuccess(categories);
}
