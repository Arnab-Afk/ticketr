import { Resend } from "resend";

const appUrl = process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const fromEmail = process.env.EMAIL_FROM ?? "ticketr <onboarding@resend.dev>";

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function ticketUrl(ticketId: string, publicToken?: string | null) {
  if (publicToken) {
    return `${appUrl}/support/tickets/${publicToken}`;
  }
  return `${appUrl}/tickets/${ticketId}`;
}

export async function sendTicketCreatedEmail(params: {
  to: string;
  requesterName: string;
  ticketId: string;
  subject: string;
  publicToken?: string | null;
}) {
  const resend = getResend();
  if (!resend) return;

  const url = ticketUrl(params.ticketId, params.publicToken);

  await resend.emails.send({
    from: fromEmail,
    to: params.to,
    subject: `[ticketr] Ticket created: ${params.subject}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#167E6C">Your support ticket was received</h2>
        <p>Hi ${params.requesterName},</p>
        <p>We received your request: <strong>${params.subject}</strong></p>
        <p>Track your ticket and reply here:</p>
        <p><a href="${url}" style="color:#167E6C">${url}</a></p>
        <p style="color:#666;font-size:13px">— ticketr support</p>
      </div>
    `,
  });
}

export async function sendTicketReplyEmail(params: {
  to: string;
  requesterName: string;
  ticketId: string;
  subject: string;
  replyPreview: string;
  publicToken?: string | null;
  isStaffReply: boolean;
}) {
  const resend = getResend();
  if (!resend) return;

  const url = ticketUrl(params.ticketId, params.publicToken);
  const heading = params.isStaffReply ? "New reply from support" : "New reply on your ticket";

  await resend.emails.send({
    from: fromEmail,
    to: params.to,
    subject: `[ticketr] ${heading}: ${params.subject}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#167E6C">${heading}</h2>
        <p>Hi ${params.requesterName},</p>
        <p><strong>${params.subject}</strong></p>
        <blockquote style="border-left:3px solid #167E6C;padding-left:12px;color:#444;margin:16px 0">
          ${params.replyPreview.slice(0, 500)}${params.replyPreview.length > 500 ? "…" : ""}
        </blockquote>
        <p><a href="${url}" style="color:#167E6C">View and reply →</a></p>
        <p style="color:#666;font-size:13px">— ticketr support</p>
      </div>
    `,
  });
}

export async function sendStaffNewTicketEmail(params: {
  to: string;
  subject: string;
  requesterName: string;
  requesterEmail: string;
  ticketId: string;
}) {
  const resend = getResend();
  if (!resend) return;

  const url = `${appUrl}/admin/tickets/${params.ticketId}`;

  await resend.emails.send({
    from: fromEmail,
    to: params.to,
    subject: `[ticketr] New ticket: ${params.subject}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#167E6C">New support ticket</h2>
        <p><strong>${params.subject}</strong></p>
        <p>From ${params.requesterName} (${params.requesterEmail})</p>
        <p><a href="${url}" style="color:#167E6C">Open in admin →</a></p>
      </div>
    `,
  });
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}
