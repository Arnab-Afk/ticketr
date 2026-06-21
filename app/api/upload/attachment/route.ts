import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError, jsonSuccess } from "@/lib/api-client";
import {
  ALLOWED_ATTACHMENT_TYPES,
  ATTACHMENT_EXT_BY_TYPE,
  ATTACHMENT_MAX_BYTES,
  getR2AttachmentPrefix,
  isR2Configured,
  uploadToR2,
} from "@/lib/r2";
import { isTicketClosed } from "@/lib/ticket-format";

export async function POST(request: NextRequest) {
  if (!isR2Configured()) {
    return jsonError("File uploads are not configured", 503);
  }

  const session = await auth();
  const publicToken = request.nextUrl.searchParams.get("token");
  const guestEmail = request.nextUrl.searchParams.get("email");
  const guestName = request.nextUrl.searchParams.get("name");

  let uploaderId: string | null = session?.user?.id ?? null;

  if (!uploaderId && publicToken) {
    const ticket = await prisma.ticket.findUnique({
      where: { publicToken },
      select: { createdById: true, status: true },
    });
    if (!ticket || isTicketClosed(ticket.status)) {
      return jsonError("Invalid or closed ticket", 403);
    }
    uploaderId = ticket.createdById;
  }

  if (!uploaderId && guestEmail && guestName) {
    const { findOrCreateGuestUser } = await import("@/lib/ticket-notifications");
    const user = await findOrCreateGuestUser(guestEmail, guestName);
    uploaderId = user.id;
  }

  if (!uploaderId) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError("No file provided", 400);
    }

    if (!ALLOWED_ATTACHMENT_TYPES.has(file.type)) {
      return jsonError("File type not allowed. Use images, PDF, or plain text.", 400);
    }

    if (file.size > ATTACHMENT_MAX_BYTES) {
      return jsonError("File must be 10 MB or smaller", 400);
    }

    const ext = ATTACHMENT_EXT_BY_TYPE[file.type] ?? "bin";
    const key = `${getR2AttachmentPrefix()}/${uploaderId}/${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToR2(key, buffer, file.type);

    const attachment = await prisma.ticketAttachment.create({
      data: {
        fileName: file.name,
        fileUrl: url,
        fileSize: file.size,
        mimeType: file.type,
        uploadedById: uploaderId,
      },
    });

    return jsonSuccess(attachment, 201);
  } catch (error) {
    console.error("Attachment upload error:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return jsonError(message, 500);
  }
}
