import { readFileSync } from "fs";
import { resolve } from "path";
import {
  sendStaffNewTicketEmail,
  sendTicketCreatedEmail,
  sendTicketEventEmail,
  sendTicketReplyEmail,
  type TicketEmailEvent,
} from "../lib/email";

function loadEnv() {
  const envPath = resolve(__dirname, "../.env");
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const RECEIPT_EVENTS: TicketEmailEvent[] = [
  "in_progress",
  "waiting_on_user",
  "resolved",
  "closed",
  "reopened",
  "assigned",
  "priority_changed",
  "staff_assigned",
  "staff_priority",
];

const ALL_TEMPLATES = [
  "ticket-created",
  "ticket-reply",
  "staff-new-ticket",
  ...RECEIPT_EVENTS.map((e) => `ticket-${e.replace(/_/g, "-")}`),
];

async function main() {
  loadEnv();

  if (!process.env.ZEPTO_API_KEY || !process.env.ZEPTO_FROM_ADDRESS) {
    console.error("Missing ZEPTO_API_KEY or ZEPTO_FROM_ADDRESS in ticketr/.env");
    process.exit(1);
  }

  const template = process.argv[2] ?? "ticket-created";
  const to = process.argv[3] ?? "arnab.b@somaiya.edu";

  const demo = {
    ticketId: "test-receipt-demo-001",
    requesterName: "Arnab Bhowmik",
    requesterEmail: "arnab.b@somaiya.edu",
    subject: "Test support request — email preview",
    publicToken: "demo-public-token-preview",
    replyPreview: "Thanks for reaching out! We're looking into this and will update you shortly.",
    assigneeName: "Support Agent",
  };

  if (template === "ticket-created") {
    await sendTicketCreatedEmail({
      to,
      requesterName: demo.requesterName,
      ticketId: demo.ticketId,
      subject: demo.subject,
      publicToken: demo.publicToken,
    });
  } else if (template === "ticket-reply") {
    await sendTicketReplyEmail({
      to,
      requesterName: demo.requesterName,
      ticketId: demo.ticketId,
      subject: demo.subject,
      replyPreview: demo.replyPreview,
      publicToken: demo.publicToken,
      isStaffReply: true,
    });
  } else if (template === "staff-new-ticket") {
    await sendStaffNewTicketEmail({
      to,
      subject: demo.subject,
      requesterName: demo.requesterName,
      requesterEmail: demo.requesterEmail,
      ticketId: demo.ticketId,
    });
  } else if (template.startsWith("ticket-")) {
    const slug = template.slice("ticket-".length).replace(/-/g, "_");
    if (!RECEIPT_EVENTS.includes(slug as TicketEmailEvent)) {
      console.error(`Unknown template: ${template}`);
      console.error(`Available: ${ALL_TEMPLATES.join(", ")}`);
      process.exit(1);
    }

    const event = slug as TicketEmailEvent;
    const status =
      event === "resolved"
        ? "resolved"
        : event === "closed"
          ? "closed"
          : event === "waiting_on_user"
            ? "waiting_on_user"
            : event === "reopened"
              ? "open"
              : "in_progress";

    await sendTicketEventEmail({
      event,
      to,
      toName: demo.requesterName,
      ticketId: demo.ticketId,
      subject: demo.subject,
      status,
      priority: event === "staff_priority" || event === "priority_changed" ? "urgent" : "normal",
      requesterName: demo.requesterName,
      requesterEmail: demo.requesterEmail,
      publicToken: demo.publicToken,
      assigneeName: demo.assigneeName,
      previousPriority: "normal",
      previousStatus:
        event === "reopened"
          ? "closed"
          : event === "resolved"
            ? "in_progress"
            : event === "in_progress"
              ? "open"
              : undefined,
      adminView: event.startsWith("staff_"),
    });
  } else {
    console.error(`Unknown template: ${template}`);
    console.error(`Available: ${ALL_TEMPLATES.join(", ")}`);
    process.exit(1);
  }

  console.log(`Sent ${template} email to ${to}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
