import { prisma } from "@/lib/db";
import { auth, isStaff } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/api-client";
import { ticketDetailInclude } from "@/lib/tickets";
import { notifyTicketReply } from "@/lib/ticket-notifications";

async function getTicketForMessage(id: string) {
  return prisma.ticket.findUnique({
    where: { id },
    include: {
      creator: { select: { fullName: true, email: true } },
      assignee: { select: { fullName: true, email: true } },
    },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("Unauthorized", 401);
  }

  const { id } = await params;
  const staff = isStaff(session.user.role);

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    return jsonError("Ticket not found", 404);
  }

  if (!staff && ticket.createdById !== session.user.id) {
    return jsonError("Forbidden", 403);
  }

  try {
    const body = await request.json();
    const messageBody = String(body.body ?? "").trim();
    const isInternal = staff && Boolean(body.isInternal);
    const attachmentIds = Array.isArray(body.attachmentIds) ? body.attachmentIds : [];

    if (!messageBody && attachmentIds.length === 0) {
      return jsonError("Message body or attachment is required");
    }

    if (body.isInternal && !staff) {
      return jsonError("Forbidden", 403);
    }

    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.ticketMessage.create({
        data: {
          ticketId: id,
          authorId: session.user!.id,
          body: messageBody || "(attachment)",
          isInternal,
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
            uploadedById: session.user!.id,
            messageId: null,
          },
          data: { messageId: created.id, ticketId: id },
        });
      }

      await tx.ticket.update({
        where: { id },
        data: {
          updatedAt: new Date(),
          ...(staff && !isInternal ? { status: "waiting_on_user" } : {}),
          ...(!staff ? { status: "open" } : {}),
        },
      });

      return tx.ticketMessage.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          author: {
            select: { id: true, fullName: true, email: true, avatarUrl: true, role: true },
          },
          attachments: true,
        },
      });
    });

    const ticketWithRelations = await getTicketForMessage(id);
    if (ticketWithRelations && !isInternal) {
      await notifyTicketReply({
        ticket: ticketWithRelations,
        messageBody,
        isStaffReply: staff,
        isInternal,
        authorEmail: session.user.email!,
      });
    }

    return jsonSuccess(message, 201);
  } catch {
    return jsonError("Failed to send message", 500);
  }
}
