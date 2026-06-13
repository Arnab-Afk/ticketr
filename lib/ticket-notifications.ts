import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

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
