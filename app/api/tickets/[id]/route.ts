import { prisma } from "@/lib/db";
import { auth, isStaff } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/api-client";
import { ticketDetailInclude } from "@/lib/tickets";
import {
  notifyTicketAssigned,
  notifyTicketPriorityChange,
  notifyTicketStatusChange,
} from "@/lib/ticket-notifications";

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
    const before = await prisma.ticket.findUnique({
      where: { id },
      include: {
        creator: { select: { fullName: true, email: true } },
        assignee: { select: { fullName: true, email: true } },
      },
    });

    if (!before) {
      return jsonError("Ticket not found", 404);
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.status) data.status = body.status;
    if (body.priority) data.priority = body.priority;
    if ("assigneeId" in body) data.assigneeId = body.assigneeId || null;

    if (body.status === "closed" || body.status === "resolved") {
      data.closedAt = new Date();
    }

    if (
      body.status &&
      (body.status === "open" || body.status === "in_progress") &&
      before.status !== body.status &&
      (before.status === "resolved" || before.status === "closed")
    ) {
      data.closedAt = null;
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data,
      include: ticketDetailInclude,
    });

    const notifyTicket = {
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      publicToken: ticket.publicToken,
      guestEmail: ticket.guestEmail,
      creator: ticket.creator,
      assignee: ticket.assignee,
    };

    if (body.status && body.status !== before.status) {
      await notifyTicketStatusChange({
        ticket: notifyTicket,
        previousStatus: before.status,
      });
    }

    if ("assigneeId" in body && body.assigneeId && body.assigneeId !== before.assigneeId) {
      const assignee = ticket.assignee;
      if (assignee) {
        await notifyTicketAssigned({
          ticket: notifyTicket,
          assigneeEmail: assignee.email,
          assigneeName: assignee.fullName,
        });
      }
    }

    if (body.priority && body.priority !== before.priority) {
      await notifyTicketPriorityChange({
        ticket: notifyTicket,
        previousPriority: before.priority,
      });
    }

    return jsonSuccess(ticket);
  } catch {
    return jsonError("Failed to update ticket", 500);
  }
}
