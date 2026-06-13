import { prisma } from "@/lib/db";
import { auth, isStaff } from "@/lib/auth";
import { jsonError } from "@/lib/api-client";
import { createTicket, ticketInclude } from "@/lib/tickets";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("Unauthorized", 401);
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
  const offset = Number(searchParams.get("offset") ?? 0);

  const staff = isStaff(session.user.role);

  const where = {
    ...(staff ? {} : { createdById: session.user.id }),
    ...(status ? { status: status as never } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(search
      ? {
          OR: [
            { subject: { contains: search } },
            { description: { contains: search } },
          ],
        }
      : {}),
  };

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: ticketInclude,
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.ticket.count({ where }),
  ]);

  return Response.json({
    success: true,
    data: tickets,
    pagination: {
      limit,
      offset,
      total,
      hasMore: offset + tickets.length < total,
    },
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const body = await request.json();
    const subject = String(body.subject ?? "").trim();
    const description = String(body.description ?? "").trim();
    const categoryId = String(body.categoryId ?? "");
    const priority = body.priority ?? "normal";
    const attachmentIds = Array.isArray(body.attachmentIds) ? body.attachmentIds : [];

    if (!subject || !description || !categoryId) {
      return jsonError("Subject, description, and category are required");
    }

    const ticket = await createTicket({
      subject,
      description,
      categoryId,
      priority,
      createdById: session.user.id,
      attachmentIds,
    });

    return Response.json({ success: true, data: ticket }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create ticket";
    return jsonError(message, 500);
  }
}
