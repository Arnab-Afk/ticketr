import { readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { generateTicketBarcodePng } from "../lib/email-barcode";
import { buildReceiptContent, type TicketEmailEvent } from "../lib/email-receipt";
import { renderReceiptEmail } from "../lib/email-templates";
import { formatReceiptDate, formatTicketNumber } from "../lib/email-format";

const demo = {
  ticketId: "preview-demo-ticket-001",
  requesterName: "Arnab Bhowmik",
  requesterEmail: "arnab.b@somaiya.edu",
  subject: "Cannot access dashboard after login",
  status: "in_progress" as const,
  priority: "high" as const,
  assigneeName: "Support Agent",
};

const receiptEvents: TicketEmailEvent[] = [
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

function pngDataUri(filename: string) {
  const buffer = readFileSync(join(__dirname, "../emails/assets", filename));
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

async function forPreview(html: string, ticketNumber: string) {
  const logo = pngDataUri("ticketr-logo.png");
  const thanks = pngDataUri("thank-you.png");
  const barcode = await generateTicketBarcodePng(ticketNumber);
  const barcodeUri = `data:image/png;base64,${barcode.toString("base64")}`;

  return html
    .replaceAll("cid:ticketr-logo", logo)
    .replaceAll("cid:ticketr-thanks", thanks)
    .replaceAll("cid:ticket-barcode", barcodeUri);
}

async function main() {
  const outDir = resolve(__dirname, "../emails");
  const number = formatTicketNumber(demo.ticketId);
  const receiptDate = formatReceiptDate();

  for (const event of receiptEvents) {
    const status =
      event === "resolved"
        ? "resolved"
        : event === "closed"
          ? "closed"
          : event === "waiting_on_user"
            ? "waiting_on_user"
            : event === "reopened"
              ? "open"
              : demo.status;

    const previousStatus =
      event === "reopened"
        ? "closed"
        : event === "resolved"
          ? "in_progress"
          : event === "in_progress"
            ? "open"
            : undefined;

    const content = buildReceiptContent(event, {
      ticketNumber: number,
      requesterName: demo.requesterName,
      requesterEmail: demo.requesterEmail,
      subject: demo.subject,
      status,
      priority: demo.priority,
      assigneeName: demo.assigneeName,
      previousPriority: "normal",
      previousStatus,
    });

    const html = await forPreview(
      renderReceiptEmail({
        ...content,
        ticketUrl: "https://ticketr.example/tickets/preview",
        ticketNumber: number,
        receiptDate,
        extraBlockHtml: content.extraBlockHtml ?? "",
        summaryRightSize: content.summaryRightSize ?? "18px",
        summaryRightColor: content.summaryRightColor ?? "#111",
        buttonColor: content.buttonColor ?? "#111",
      }),
      number
    );

    const filename = `ticket-${event.replace(/_/g, "-")}.html`;
    writeFileSync(join(outDir, filename), html, "utf8");
    console.log(`Wrote emails/${filename}`);
  }

  console.log("Done — open any file in emails/ to preview in browser.");
}

main().catch(console.error);
