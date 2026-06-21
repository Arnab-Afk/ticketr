import { prisma } from "@/lib/db";
import { jsonError, jsonSuccess } from "@/lib/api-client";
import { notifyAfterMessage } from "@/lib/ticket-notifications";
import { isTicketClosed } from "@/lib/ticket-format";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { publicToken: token },
    include: {
      creator: { select: { id: true, fullName: true, email: true } },
      assignee: { select: { fullName: true, email: true } },
    },
  });

  if (!ticket) {
    return jsonError("Ticket not found", 404);
  }

  if (isTicketClosed(ticket.status)) {
    return jsonError("This ticket is closed", 400);
  }

  const previousStatus = ticket.status;

  try {
    const body = await request.json();
    const messageBody = String(body.body ?? "").trim();
    const attachmentIds = Array.isArray(body.attachmentIds) ? body.attachmentIds : [];

    if (!messageBody && attachmentIds.length === 0) {
      return jsonError("Message body or attachment is required");
    }

    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          authorId: ticket.createdById,
          body: messageBody || "(attachment)",
          isInternal: false,
        },
        include: {
          author: {
            select: { id: true, fullName: true, email: true, avatarUrl: true, role: true },
          },
          attachments: true,
        },
      });

      if (attachmentIds.length) {
        await tx.ticketAttachment.updateMany({
          where: {
            id: { in: attachmentIds },
            uploadedById: ticket.createdById,
            messageId: null,
          },
          data: { messageId: created.id, ticketId: ticket.id },
        });
      }

      await tx.ticket.update({
        where: { id: ticket.id },
        data: { updatedAt: new Date(), status: "open" },
      });

      return created;
    });

    const updatedTicket = await prisma.ticket.findUnique({
      where: { id: ticket.id },
      include: {
        creator: { select: { id: true, fullName: true, email: true } },
        assignee: { select: { fullName: true, email: true } },
      },
    });

    if (updatedTicket) {
      await notifyAfterMessage({
        ticket: updatedTicket,
        previousStatus,
        messageBody,
        attachmentCount: attachmentIds.length,
        isStaffReply: false,
        isInternal: false,
        authorEmail: ticket.creator.email,
      });
    }

    return jsonSuccess(message, 201);
  } catch (error) {
    console.error("[public-messages] failed:", error);
    return jsonError("Failed to send message", 500);
  }
}
