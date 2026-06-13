import { prisma } from "@/lib/db";
import { auth, isStaff, requireStaff } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/api-client";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("Unauthorized", 401);
  }

  if (!isStaff(session.user.role)) {
    return jsonError("Forbidden", 403);
  }

  const responses = await prisma.cannedResponse.findMany({
    where: { isGlobal: true },
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      body: true,
      shortcut: true,
      isGlobal: true,
    },
  });

  return jsonSuccess(responses);
}

export async function POST(request: Request) {
  try {
    const session = await requireStaff();
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const content = String(body.body ?? "").trim();
    const shortcut = body.shortcut ? String(body.shortcut).trim() : null;

    if (!title || !content) {
      return jsonError("Title and body are required");
    }

    const response = await prisma.cannedResponse.create({
      data: {
        title,
        body: content,
        shortcut,
        createdById: session.user.id,
        isGlobal: true,
      },
    });

    return jsonSuccess(response, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create";
    const status = message === "Forbidden" || message === "Unauthorized" ? 403 : 500;
    return jsonError(message, status);
  }
}
