import { prisma } from "@/lib/db";
import { jsonError, jsonSuccess } from "@/lib/api-client";
import { notifyTicketReply } from "@/lib/ticket-notifications";

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

  if (ticket.status === "closed") {
    return jsonError("This ticket is closed", 400);
  }

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

    await notifyTicketReply({
      ticket,
      messageBody,
      isStaffReply: false,
      isInternal: false,
      authorEmail: ticket.creator.email,
    });

    return jsonSuccess(message, 201);
  } catch {
    return jsonError("Failed to send message", 500);
  }
}
