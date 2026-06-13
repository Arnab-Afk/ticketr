import { prisma } from "@/lib/db";
import { jsonError, jsonSuccess } from "@/lib/api-client";
import {
  createTicket,
  generateGuestToken,
  ticketDetailInclude,
} from "@/lib/tickets";
import { findOrCreateGuestUser } from "@/lib/ticket-notifications";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").toLowerCase().trim();
    const fullName = String(body.fullName ?? "").trim();
    const subject = String(body.subject ?? "").trim();
    const description = String(body.description ?? "").trim();
    const categoryId = String(body.categoryId ?? "");
    const priority = body.priority ?? "normal";
    const attachmentIds = Array.isArray(body.attachmentIds) ? body.attachmentIds : [];

    if (!email || !fullName || !subject || !description || !categoryId) {
      return jsonError("Name, email, subject, description, and category are required");
    }

    const user = await findOrCreateGuestUser(email, fullName);
    const publicToken = generateGuestToken();

    const ticket = await createTicket({
      subject,
      description,
      categoryId,
      priority,
      createdById: user.id,
      guestEmail: email,
      publicToken,
      attachmentIds,
    });

    return jsonSuccess(
      {
        ticket,
        publicUrl: `/support/tickets/${publicToken}`,
      },
      201
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create ticket";
    return jsonError(message, 500);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return jsonError("Token is required", 400);
  }

  const ticket = await prisma.ticket.findUnique({
    where: { publicToken: token },
    include: {
      ...ticketDetailInclude,
      messages: {
        where: { isInternal: false },
        include: ticketDetailInclude.messages.include,
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!ticket) {
    return jsonError("Ticket not found", 404);
  }

  return jsonSuccess(ticket);
}
