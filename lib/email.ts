import type { TicketPriority, TicketStatus } from "@prisma/client";
import { emailAppUrl, supportEmailAddress } from "@/lib/email-config";
import { renderReceiptEmail } from "@/lib/email-templates";
import { formatReceiptDate, formatTicketNumber } from "@/lib/email-format";
import {
  buildReceiptContent,
  type TicketEmailEvent,
} from "@/lib/email-receipt";
import { ensureUserAccessToken } from "@/lib/user-access-token";

const appName = process.env.TICKETR_NAME ?? "ticketr";

function zeptoApiUrl() {
  return process.env.ZEPTO_API_URL ?? "https://api.zeptomail.com/v1.1/email";
}

function isZeptoConfigured(): boolean {
  return Boolean(process.env.ZEPTO_API_KEY && process.env.ZEPTO_FROM_ADDRESS);
}

async function sendEmail(params: {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  ticketNumber: string;
}) {
  if (!isZeptoConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[email] ZeptoMail not configured — set ZEPTO_API_KEY and ZEPTO_FROM_ADDRESS");
    }
    return;
  }

  const { zeptoInlineImages } = await import("@/lib/email-brand-images");
  const fromAddress = process.env.ZEPTO_FROM_ADDRESS!;
  const fromName = process.env.ZEPTO_FROM_NAME ?? appName;

  const response = await fetch(zeptoApiUrl(), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Zoho-enczapikey ${process.env.ZEPTO_API_KEY}`,
    },
    body: JSON.stringify({
      from: { address: fromAddress, name: fromName },
      to: [
        {
          email_address: {
            address: params.to,
            ...(params.toName ? { name: params.toName } : {}),
          },
        },
      ],
      subject: params.subject,
      htmlbody: params.html,
      inline_images: await zeptoInlineImages(params.ticketNumber),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`ZeptoMail failed (${response.status}): ${body}`);
  }
}

async function customerTicketUrl(
  ticketId: string,
  publicToken?: string | null,
  requesterId?: string
) {
  const appUrl = emailAppUrl();
  if (publicToken && requesterId) {
    const accessToken = await ensureUserAccessToken(requesterId);
    return `${appUrl}/support/tickets/${publicToken}?access=${accessToken}`;
  }
  if (publicToken) {
    return `${appUrl}/support/tickets/${publicToken}`;
  }
  return `${appUrl}/tickets/${ticketId}`;
}

function adminTicketUrl(ticketId: string) {
  return `${emailAppUrl()}/admin/tickets/${ticketId}`;
}

function receiptVars(ticketId: string) {
  return {
    ticketNumber: formatTicketNumber(ticketId),
    receiptDate: formatReceiptDate(),
  };
}

function renderEventEmail(
  event: TicketEmailEvent,
  params: {
    ticketId: string;
    ticketUrl: string;
    requesterName: string;
    requesterEmail?: string;
    subject: string;
    status: TicketStatus;
    priority: TicketPriority;
    assigneeName?: string;
    previousPriority?: TicketPriority;
    previousStatus?: TicketStatus;
  }
) {
  const number = formatTicketNumber(params.ticketId);
  const content = buildReceiptContent(event, {
    ticketNumber: number,
    requesterName: params.requesterName,
    requesterEmail: params.requesterEmail,
    subject: params.subject,
    status: params.status,
    priority: params.priority,
    assigneeName: params.assigneeName,
    previousPriority: params.previousPriority,
    previousStatus: params.previousStatus,
  });

  return {
    subject: `[${appName}] ${content.subject}`,
    html: renderReceiptEmail({
      ...content,
      ticketUrl: params.ticketUrl,
      ...receiptVars(params.ticketId),
      extraBlockHtml: content.extraBlockHtml ?? "",
      summaryRightSize: content.summaryRightSize ?? "18px",
      summaryRightColor: content.summaryRightColor ?? "#111",
      buttonColor: content.buttonColor ?? "#111",
    }),
  };
}

export async function sendTicketCreatedEmail(params: {
  to: string;
  requesterName: string;
  requesterId: string;
  ticketId: string;
  subject: string;
  publicToken?: string | null;
}) {
  const { renderEmailTemplate } = await import("@/lib/email-templates");
  const url = await customerTicketUrl(
    params.ticketId,
    params.publicToken,
    params.requesterId
  );
  const number = formatTicketNumber(params.ticketId);

  await sendEmail({
    to: params.to,
    toName: params.requesterName,
    subject: `[${appName}] RECEIPT #${number} — request queued`,
    ticketNumber: number,
    html: renderEmailTemplate("ticket-created", {
      preheader: `Receipt #${number}: your support request is in the queue.`,
      requesterName: params.requesterName,
      subject: params.subject,
      ticketUrl: url,
      supportEmail: supportEmailAddress(),
      ...receiptVars(params.ticketId),
    }),
  });
}

export async function sendTicketReplyEmail(params: {
  to: string;
  requesterName: string;
  requesterId?: string;
  ticketId: string;
  subject: string;
  replyPreview: string;
  publicToken?: string | null;
  isStaffReply: boolean;
  adminView?: boolean;
}) {
  const { renderEmailTemplate, truncatePreview } = await import("@/lib/email-templates");
  const url = params.adminView
    ? adminTicketUrl(params.ticketId)
    : await customerTicketUrl(
        params.ticketId,
        params.publicToken,
        params.requesterId
      );
  const heading = params.isStaffReply
    ? "NEW REPLY FROM SUPPORT"
    : "NEW CUSTOMER REPLY";
  const number = formatTicketNumber(params.ticketId);

  await sendEmail({
    to: params.to,
    toName: params.requesterName,
    subject: `[${appName}] UPDATE #${number} — ${heading.toLowerCase()}`,
    ticketNumber: number,
    html: renderEmailTemplate("ticket-reply", {
      preheader: `${heading} on receipt #${number}`,
      heading,
      requesterName: params.requesterName,
      subject: params.subject,
      replyPreview: truncatePreview(params.replyPreview),
      ticketUrl: url,
      ...receiptVars(params.ticketId),
    }),
  });
}

export async function sendStaffNewTicketEmail(params: {
  to: string;
  subject: string;
  requesterName: string;
  requesterEmail: string;
  ticketId: string;
}) {
  const { renderEmailTemplate } = await import("@/lib/email-templates");
  const url = adminTicketUrl(params.ticketId);
  const number = formatTicketNumber(params.ticketId);

  await sendEmail({
    to: params.to,
    subject: `[${appName}] NEW ORDER #${number} — ${params.subject}`,
    ticketNumber: number,
    html: renderEmailTemplate("staff-new-ticket", {
      preheader: `New support order from ${params.requesterName}`,
      subject: params.subject,
      requesterName: params.requesterName,
      requesterEmail: params.requesterEmail,
      ticketUrl: url,
      ...receiptVars(params.ticketId),
    }),
  });
}

export async function sendTicketEventEmail(params: {
  event: TicketEmailEvent;
  to: string;
  toName?: string;
  ticketId: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  requesterName: string;
  requesterEmail?: string;
  requesterId?: string;
  publicToken?: string | null;
  assigneeName?: string;
  previousPriority?: TicketPriority;
  previousStatus?: TicketStatus;
  adminView?: boolean;
}) {
  const number = formatTicketNumber(params.ticketId);
  const url = params.adminView
    ? adminTicketUrl(params.ticketId)
    : await customerTicketUrl(
        params.ticketId,
        params.publicToken,
        params.requesterId
      );

  const { subject, html } = renderEventEmail(params.event, {
    ticketId: params.ticketId,
    ticketUrl: url,
    requesterName: params.requesterName,
    requesterEmail: params.requesterEmail,
    subject: params.subject,
    status: params.status,
    priority: params.priority,
    assigneeName: params.assigneeName,
    previousPriority: params.previousPriority,
    previousStatus: params.previousStatus,
  });

  await sendEmail({
    to: params.to,
    toName: params.toName,
    subject,
    ticketNumber: number,
    html,
  });
}

export function isEmailConfigured(): boolean {
  return isZeptoConfigured();
}

export { buildReceiptContent, type TicketEmailEvent } from "@/lib/email-receipt";
