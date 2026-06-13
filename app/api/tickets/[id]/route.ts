import { prisma } from "@/lib/db";
import { auth, isStaff } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/api-client";
import { ticketDetailInclude } from "@/lib/tickets";
import { notifyTicketReply } from "@/lib/ticket-notifications";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("Unauthorized", 401);
  }

  const { id } = await params;
  const staff = isStaff(session.user.role);

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      ...ticketDetailInclude,
      messages: {
        where: staff ? {} : { isInternal: false },
        include: ticketDetailInclude.messages.include,
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!ticket) {
    return jsonError("Ticket not found", 404);
  }

  if (!staff && ticket.createdById !== session.user.id) {
    return jsonError("Forbidden", 403);
  }

  return jsonSuccess(ticket);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("Unauthorized", 401);
  }

  if (!isStaff(session.user.role)) {
    return jsonError("Forbidden", 403);
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.status) data.status = body.status;
    if (body.priority) data.priority = body.priority;
    if ("assigneeId" in body) data.assigneeId = body.assigneeId || null;

    if (body.status === "closed" || body.status === "resolved") {
      data.closedAt = new Date();
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data,
      include: ticketDetailInclude,
    });

    return jsonSuccess(ticket);
  } catch {
    return jsonError("Failed to update ticket", 500);
  }
}
