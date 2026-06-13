import type { TicketPriority, TicketStatus } from "@prisma/client";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { statusToEvent } from "@/lib/email-receipt";

export function generatePublicToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function findOrCreateGuestUser(email: string, fullName: string) {
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    if (existing.fullName !== fullName && fullName.trim()) {
      return prisma.user.update({
        where: { id: existing.id },
        data: { fullName: fullName.trim() },
      });
    }
    return existing;
  }

  const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);

  return prisma.user.create({
    data: {
      email: normalizedEmail,
      fullName: fullName.trim(),
      passwordHash,
    },
  });
}

type TicketNotifyShape = {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  publicToken: string | null;
  guestEmail: string | null;
  creator: { fullName: string; email: string };
  assignee: { fullName: string; email: string } | null;
};

function customerEmail(ticket: TicketNotifyShape) {
  return ticket.guestEmail ?? ticket.creator.email;
}

export async function notifyStaffOfNewTicket(ticket: {
  id: string;
  subject: string;
  creator: { fullName: string; email: string };
}) {
  const { sendStaffNewTicketEmail } = await import("@/lib/email");

  const staff = await prisma.user.findMany({
    where: { role: { in: ["admin", "agent"] } },
    select: { email: true },
  });

  await Promise.all(
    staff.map((member) =>
      sendStaffNewTicketEmail({
        to: member.email,
        subject: ticket.subject,
        requesterName: ticket.creator.fullName,
        requesterEmail: ticket.creator.email,
        ticketId: ticket.id,
      })
    )
  );
}

export async function notifyTicketStatusChange(params: {
  ticket: TicketNotifyShape;
  previousStatus: TicketStatus;
}) {
  const event = statusToEvent(params.ticket.status, params.previousStatus);
  if (!event) return;

  const { sendTicketEventEmail } = await import("@/lib/email");

  await sendTicketEventEmail({
    event,
    to: customerEmail(params.ticket),
    toName: params.ticket.creator.fullName,
    ticketId: params.ticket.id,
    subject: params.ticket.subject,
    status: params.ticket.status,
    priority: params.ticket.priority,
    requesterName: params.ticket.creator.fullName,
    publicToken: params.ticket.publicToken,
    assigneeName: params.ticket.assignee?.fullName,
    previousStatus: params.previousStatus,
  });
}

export async function notifyTicketAssigned(params: {
  ticket: TicketNotifyShape;
  assigneeEmail: string;
  assigneeName: string;
}) {
  const { sendTicketEventEmail } = await import("@/lib/email");

  await Promise.all([
    sendTicketEventEmail({
      event: "assigned",
      to: customerEmail(params.ticket),
      toName: params.ticket.creator.fullName,
      ticketId: params.ticket.id,
      subject: params.ticket.subject,
      status: params.ticket.status,
      priority: params.ticket.priority,
      requesterName: params.ticket.creator.fullName,
      publicToken: params.ticket.publicToken,
      assigneeName: params.assigneeName,
    }),
    sendTicketEventEmail({
      event: "staff_assigned",
      to: params.assigneeEmail,
      toName: params.assigneeName,
      ticketId: params.ticket.id,
      subject: params.ticket.subject,
      status: params.ticket.status,
      priority: params.ticket.priority,
      requesterName: params.ticket.creator.fullName,
      requesterEmail: params.ticket.creator.email,
      assigneeName: params.assigneeName,
      adminView: true,
    }),
  ]);
}

export async function notifyTicketPriorityChange(params: {
  ticket: TicketNotifyShape;
  previousPriority: TicketPriority;
}) {
  const { sendTicketEventEmail } = await import("@/lib/email");
  const escalated =
    params.ticket.priority === "urgent" || params.ticket.priority === "high";

  const sends = [
    sendTicketEventEmail({
      event: "priority_changed",
      to: customerEmail(params.ticket),
      toName: params.ticket.creator.fullName,
      ticketId: params.ticket.id,
      subject: params.ticket.subject,
      status: params.ticket.status,
      priority: params.ticket.priority,
      requesterName: params.ticket.creator.fullName,
      publicToken: params.ticket.publicToken,
      previousPriority: params.previousPriority,
    }),
  ];

  if (escalated) {
    const staffEmails = new Set<string>();
    if (params.ticket.assignee) {
      staffEmails.add(params.ticket.assignee.email);
    } else {
      const staff = await prisma.user.findMany({
        where: { role: { in: ["admin", "agent"] } },
        select: { email: true },
      });
      staff.forEach((s) => staffEmails.add(s.email));
    }

    for (const to of staffEmails) {
      sends.push(
        sendTicketEventEmail({
          event: "staff_priority",
          to,
          ticketId: params.ticket.id,
          subject: params.ticket.subject,
          status: params.ticket.status,
          priority: params.ticket.priority,
          requesterName: params.ticket.creator.fullName,
          requesterEmail: params.ticket.creator.email,
          previousPriority: params.previousPriority,
          adminView: true,
        })
      );
    }
  }

  await Promise.all(sends);
}

export async function notifyTicketReply(params: {
  ticket: {
    id: string;
    subject: string;
    publicToken: string | null;
    guestEmail: string | null;
    creator: { fullName: string; email: string };
    assignee: { email: string; fullName: string } | null;
  };
  messageBody: string;
  isStaffReply: boolean;
  isInternal: boolean;
  authorEmail: string;
}) {
  if (params.isInternal) return;

  const { sendTicketReplyEmail } = await import("@/lib/email");
  const recipientEmail = params.ticket.guestEmail ?? params.ticket.creator.email;

  if (params.isStaffReply) {
    await sendTicketReplyEmail({
      to: recipientEmail,
      requesterName: params.ticket.creator.fullName,
      ticketId: params.ticket.id,
      subject: params.ticket.subject,
      replyPreview: params.messageBody,
      publicToken: params.ticket.publicToken,
      isStaffReply: true,
    });
    return;
  }

  const staffEmails = new Set<string>();
  if (params.ticket.assignee) {
    staffEmails.add(params.ticket.assignee.email);
  } else {
    const staff = await prisma.user.findMany({
      where: { role: { in: ["admin", "agent"] } },
      select: { email: true },
    });
    staff.forEach((s) => staffEmails.add(s.email));
  }

  staffEmails.delete(params.authorEmail);

  await Promise.all(
    [...staffEmails].map((to) =>
      sendTicketReplyEmail({
        to,
        requesterName: "Support team",
        ticketId: params.ticket.id,
        subject: params.ticket.subject,
        replyPreview: params.messageBody,
        publicToken: null,
        isStaffReply: false,
      })
    )
  );
}
