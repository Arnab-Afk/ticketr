import type { TicketPriority } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generatePublicToken } from "@/lib/ticket-notifications";
import {
  notifyStaffOfNewTicket,
} from "@/lib/ticket-notifications";
import { sendTicketCreatedEmail } from "@/lib/email";

export const ticketInclude = {
  category: true,
  creator: {
    select: { id: true, fullName: true, email: true, avatarUrl: true, role: true },
  },
  assignee: {
    select: { id: true, fullName: true, email: true, avatarUrl: true, role: true },
  },
  _count: { select: { messages: true } },
};

export const ticketDetailInclude = {
  ...ticketInclude,
  attachments: true,
  messages: {
    include: {
      author: {
        select: { id: true, fullName: true, email: true, avatarUrl: true, role: true },
      },
      attachments: true,
    },
    orderBy: { createdAt: "asc" as const },
  },
};

export interface CreateTicketOptions {
  subject: string;
  description: string;
  categoryId: string;
  createdById: string;
  priority?: TicketPriority;
  guestEmail?: string;
  publicToken?: string;
  attachmentIds?: string[];
}

export async function createTicket(options: CreateTicketOptions) {
  const category = await prisma.ticketCategory.findFirst({
    where: { id: options.categoryId, isActive: true },
  });
  if (!category) {
    throw new Error("Invalid category");
  }

  const publicToken = options.publicToken ?? undefined;

  const ticket = await prisma.ticket.create({
    data: {
      subject: options.subject,
      description: options.description,
      categoryId: options.categoryId,
      priority: options.priority ?? "normal",
      createdById: options.createdById,
      guestEmail: options.guestEmail,
      publicToken,
      messages: {
        create: {
          authorId: options.createdById,
          body: options.description,
          isInternal: false,
        },
      },
    },
    include: {
      ...ticketDetailInclude,
      messages: {
        where: { isInternal: false },
        include: ticketDetailInclude.messages.include,
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (options.attachmentIds?.length) {
    await prisma.ticketAttachment.updateMany({
      where: {
        id: { in: options.attachmentIds },
        uploadedById: options.createdById,
        ticketId: null,
        messageId: null,
      },
      data: { ticketId: ticket.id },
    });
  }

  const creator = ticket.creator;
  const notifyEmail = options.guestEmail ?? creator.email;

  await Promise.all([
    sendTicketCreatedEmail({
      to: notifyEmail,
      requesterName: creator.fullName,
      ticketId: ticket.id,
      subject: ticket.subject,
      publicToken: ticket.publicToken,
    }),
    notifyStaffOfNewTicket({
      id: ticket.id,
      subject: ticket.subject,
      creator,
    }),
  ]);

  return prisma.ticket.findUniqueOrThrow({
    where: { id: ticket.id },
    include: ticketDetailInclude,
  });
}

export function generateGuestToken() {
  return generatePublicToken();
}
