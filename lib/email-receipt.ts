import type { TicketPriority, TicketStatus } from "@prisma/client";

const mono = "font-family:'Courier New',Courier,monospace;";

export function dottedRow(label: string, value: string, bold = false) {
  return `<tr>
    <td class="receipt-label" style="padding:6px 0; white-space:nowrap; font-family:'Courier New',Courier,monospace; color:#111111;">${label}</td>
    <td class="dot-leader" style="padding:6px 4px; color:#999999; overflow:hidden; font-family:'Courier New',Courier,monospace;">..............................</td>
    <td class="receipt-value" align="right" style="padding:6px 0; white-space:nowrap; font-family:'Courier New',Courier,monospace; color:#111111;${bold ? " font-weight:700;" : ""}">${value}</td>
  </tr>`;
}

export function sectionHeader(title: string) {
  return `<tr>
    <td colspan="3" style="padding:10px 0 6px; font-weight:700; border-top:1px dotted #ccc;">${title}</td>
  </tr>`;
}

export function itemRow(subject: string, badge: string) {
  return `<tr>
    <td colspan="2" style="padding:4px 0; line-height:1.4;">${subject}</td>
    <td align="right" style="padding:4px 0; white-space:nowrap; vertical-align:top;">${badge}</td>
  </tr>`;
}

export function noteBlock(text: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="margin-top:14px; border:2px dashed #bbb; background:rgba(255,255,255,0.35);">
    <tr>
      <td style="${mono}padding:14px 16px; font-size:12px; color:#222; line-height:1.65;">${text}</td>
    </tr>
  </table>`;
}

export function formatStatusLabel(status: TicketStatus): string {
  const labels: Record<TicketStatus, string> = {
    open: "OPEN",
    in_progress: "IN PROGRESS",
    waiting_on_user: "AWAITING YOU",
    resolved: "RESOLVED",
    closed: "CLOSED",
  };
  return labels[status];
}

export function formatPriorityLabel(priority: TicketPriority): string {
  const labels: Record<TicketPriority, string> = {
    low: "LOW",
    normal: "NORMAL",
    high: "HIGH",
    urgent: "URGENT",
  };
  return labels[priority];
}

export interface ReceiptEmailContent {
  pageTitle: string;
  preheader: string;
  subject: string;
  receiptLabel: string;
  sectionTitle: string;
  subtitle: string;
  lineItemsHtml: string;
  extraBlockHtml?: string;
  summaryLeft: string;
  summaryRight: string;
  summaryRightSize?: string;
  summaryRightColor?: string;
  ctaText: string;
  footerLeft: string;
  buttonColor?: string;
}

export function baseCustomerRows(params: {
  requesterName: string;
  subject: string;
  statusLabel: string;
  itemBadge?: string;
}) {
  return [
    dottedRow("CUSTOMER", params.requesterName, true),
    sectionHeader("ITEM"),
    itemRow(params.subject, params.itemBadge ?? params.statusLabel),
    dottedRow("STATUS", params.statusLabel, true),
  ].join("");
}

export function baseStaffRows(params: {
  requesterName: string;
  requesterEmail: string;
  subject: string;
  statusLabel: string;
}) {
  return [
    dottedRow("FROM", params.requesterName, true),
    dottedRow("EMAIL", params.requesterEmail),
    sectionHeader("ITEM"),
    itemRow(params.subject, params.statusLabel),
  ].join("");
}

export type TicketEmailEvent =
  | "in_progress"
  | "waiting_on_user"
  | "resolved"
  | "closed"
  | "reopened"
  | "assigned"
  | "priority_changed"
  | "staff_assigned"
  | "staff_priority";

export function statusChangeMessage(
  newLabel: string,
  previousLabel?: string
): string {
  if (previousLabel && previousLabel !== newLabel) {
    return `Your ticket status has been changed from ${previousLabel} to ${newLabel}.`;
  }
  return `Your ticket status has been changed to ${newLabel}.`;
}

export function priorityChangeMessage(
  newLabel: string,
  previousLabel?: string
): string {
  if (previousLabel && previousLabel !== newLabel) {
    return `Your ticket priority has been changed from ${previousLabel} to ${newLabel}.`;
  }
  return `Your ticket priority has been changed to ${newLabel}.`;
}

function statusChangeReceipt(params: {
  ticketNumber: string;
  requesterName: string;
  subject: string;
  statusLabel: string;
  previousStatusLabel?: string;
  pageTitle: string;
  emailSubject: string;
  preheader: string;
  footerLeft: string;
  ctaText?: string;
  summaryRightColor?: string;
  extraNote?: string;
  assigneeName?: string;
}): ReceiptEmailContent {
  const changeMessage = statusChangeMessage(
    params.statusLabel,
    params.previousStatusLabel
  );

  return {
    pageTitle: params.pageTitle,
    preheader: params.preheader,
    subject: params.emailSubject,
    receiptLabel: "STATUS CHANGE",
    sectionTitle: "SUPPORT",
    subtitle: `/ status has been changed to ${params.statusLabel} /`,
    lineItemsHtml: [
      dottedRow("CUSTOMER", params.requesterName, true),
      sectionHeader("ITEM"),
      itemRow(params.subject, params.statusLabel),
      sectionHeader("STATUS UPDATE"),
      dottedRow("CHANGED TO", params.statusLabel, true),
      params.assigneeName
        ? dottedRow("AGENT", params.assigneeName, true)
        : "",
    ].join(""),
    extraBlockHtml: noteBlock(
      [changeMessage, params.extraNote].filter(Boolean).join(" ")
    ),
    summaryLeft: "NEW STATUS",
    summaryRight: params.statusLabel,
    summaryRightSize: "18px",
    summaryRightColor: params.summaryRightColor ?? "#111",
    ctaText: params.ctaText ?? "VIEW TICKET →",
    footerLeft: params.footerLeft,
  };
}

export function buildReceiptContent(
  event: TicketEmailEvent,
  params: {
    ticketNumber: string;
    requesterName: string;
    requesterEmail?: string;
    subject: string;
    status: TicketStatus;
    priority: TicketPriority;
    assigneeName?: string;
    previousPriority?: TicketPriority;
    previousStatus?: TicketStatus;
  }
): ReceiptEmailContent {
  const statusLabel = formatStatusLabel(params.status);
  const priorityLabel = formatPriorityLabel(params.priority);
  const previousStatusLabel = params.previousStatus
    ? formatStatusLabel(params.previousStatus)
    : undefined;
  const previousPriorityLabel = params.previousPriority
    ? formatPriorityLabel(params.previousPriority)
    : undefined;

  const customerBase = {
    requesterName: params.requesterName,
    subject: params.subject,
    statusLabel,
  };

  switch (event) {
    case "in_progress":
      return statusChangeReceipt({
        ticketNumber: params.ticketNumber,
        requesterName: params.requesterName,
        subject: params.subject,
        statusLabel: "IN PROGRESS",
        previousStatusLabel,
        pageTitle: "Status change",
        emailSubject: `STATUS #${params.ticketNumber} — changed to in progress`,
        preheader: `Receipt #${params.ticketNumber}: status changed to in progress.`,
        footerLeft: "we're on it",
        assigneeName: params.assigneeName,
      });

    case "waiting_on_user":
      return statusChangeReceipt({
        ticketNumber: params.ticketNumber,
        requesterName: params.requesterName,
        subject: params.subject,
        statusLabel: "AWAITING YOU",
        previousStatusLabel,
        pageTitle: "Follow up",
        emailSubject: `STATUS #${params.ticketNumber} — changed to awaiting your reply`,
        preheader: `Receipt #${params.ticketNumber}: status changed — we need your reply.`,
        footerLeft: "waiting on you",
        ctaText: "REPLY NOW →",
        extraNote: "Please reply with the requested details so we can keep moving on your ticket.",
      });

    case "resolved":
      return statusChangeReceipt({
        ticketNumber: params.ticketNumber,
        requesterName: params.requesterName,
        subject: params.subject,
        statusLabel: "RESOLVED",
        previousStatusLabel,
        pageTitle: "Status change",
        emailSubject: `STATUS #${params.ticketNumber} — changed to resolved`,
        preheader: `Receipt #${params.ticketNumber}: status changed to resolved.`,
        footerLeft: "case closed (for now)",
        ctaText: "VIEW RECEIPT →",
        summaryRightColor: "#1a7f37",
        extraNote: "If this isn't fixed, reply within 48 hours to reopen your receipt.",
      });

    case "closed":
      return statusChangeReceipt({
        ticketNumber: params.ticketNumber,
        requesterName: params.requesterName,
        subject: params.subject,
        statusLabel: "CLOSED",
        previousStatusLabel,
        pageTitle: "Status change",
        emailSubject: `STATUS #${params.ticketNumber} — changed to closed`,
        preheader: `Receipt #${params.ticketNumber}: status changed to closed.`,
        footerLeft: "thanks for reaching out",
        ctaText: "VIEW HISTORY →",
      });

    case "reopened":
      return statusChangeReceipt({
        ticketNumber: params.ticketNumber,
        requesterName: params.requesterName,
        subject: params.subject,
        statusLabel: "OPEN",
        previousStatusLabel,
        pageTitle: "Status change",
        emailSubject: `STATUS #${params.ticketNumber} — changed to open`,
        preheader: `Receipt #${params.ticketNumber}: status changed to open.`,
        footerLeft: "we're back on it",
      });

    case "assigned":
      return {
        pageTitle: "Assigned",
        preheader: `Receipt #${params.ticketNumber}: an agent has been assigned.`,
        subject: `ASSIGNED #${params.ticketNumber} — agent on your case`,
        receiptLabel: "ASSIGNED",
        sectionTitle: "SUPPORT",
        subtitle: `/ assigned to ${params.assigneeName ?? "support"} /`,
        lineItemsHtml: [
          dottedRow("CUSTOMER", params.requesterName, true),
          sectionHeader("ITEM"),
          itemRow(params.subject, "ASSIGNED"),
          sectionHeader("ASSIGNMENT"),
          dottedRow("AGENT", params.assigneeName ?? "SUPPORT", true),
          dottedRow("STATUS", statusLabel, true),
        ].join(""),
        extraBlockHtml: noteBlock(
          `Your ticket has been assigned to ${params.assigneeName ?? "a support agent"}. Current status: ${statusLabel}.`
        ),
        summaryLeft: "OWNER",
        summaryRight: params.assigneeName ?? "SUPPORT",
        summaryRightSize: "14px",
        ctaText: "VIEW TICKET →",
        footerLeft: "you're in good hands",
      };

    case "priority_changed":
      return {
        pageTitle: "Priority update",
        preheader: `Receipt #${params.ticketNumber}: priority changed to ${priorityLabel}.`,
        subject: `PRIORITY #${params.ticketNumber} — changed to ${priorityLabel.toLowerCase()}`,
        receiptLabel: "PRIORITY",
        sectionTitle: "SUPPORT",
        subtitle: `/ priority has been changed to ${priorityLabel} /`,
        lineItemsHtml: [
          dottedRow("CUSTOMER", params.requesterName, true),
          sectionHeader("ITEM"),
          itemRow(params.subject, priorityLabel),
          sectionHeader("PRIORITY UPDATE"),
          dottedRow("CHANGED TO", priorityLabel, true),
        ].join(""),
        extraBlockHtml: noteBlock(
          priorityChangeMessage(priorityLabel, previousPriorityLabel)
        ),
        summaryLeft: "NEW LEVEL",
        summaryRight: priorityLabel,
        summaryRightSize: "22px",
        summaryRightColor: params.priority === "urgent" ? "#c1121f" : "#111",
        ctaText: "VIEW TICKET →",
        footerLeft: "priority adjusted",
      };

    case "staff_assigned":
      return {
        pageTitle: "New assignment",
        preheader: `Order #${params.ticketNumber}: assigned to you.`,
        subject: `ASSIGNED #${params.ticketNumber} — ${params.subject}`,
        receiptLabel: "ASSIGNED",
        sectionTitle: "STAFF COPY",
        subtitle: "/ this order has been assigned to you /",
        lineItemsHtml: [
          ...baseStaffRows({
            requesterName: params.requesterName,
            requesterEmail: params.requesterEmail ?? "",
            subject: params.subject,
            statusLabel,
          }),
          sectionHeader("STATUS"),
          dottedRow("CURRENT", statusLabel, true),
        ].join(""),
        extraBlockHtml: noteBlock(
          `This ticket has been assigned to you. Current status: ${statusLabel}.`
        ),
        summaryLeft: "QUEUE",
        summaryRight: "+1 YOURS",
        summaryRightSize: "18px",
        summaryRightColor: "#c1121f",
        ctaText: "OPEN IN ADMIN →",
        footerLeft: "admin queue",
        buttonColor: "#c1121f",
      };

    case "staff_priority":
      return {
        pageTitle: "Priority escalation",
        preheader: `Order #${params.ticketNumber}: priority changed to ${priorityLabel}.`,
        subject: `ESCALATED #${params.ticketNumber} — priority changed to ${priorityLabel.toLowerCase()}`,
        receiptLabel: "ESCALATED",
        sectionTitle: "STAFF COPY",
        subtitle: `/ priority has been changed to ${priorityLabel} /`,
        lineItemsHtml: [
          ...baseStaffRows({
            requesterName: params.requesterName,
            requesterEmail: params.requesterEmail ?? "",
            subject: params.subject,
            statusLabel,
          }),
          sectionHeader("PRIORITY UPDATE"),
          dottedRow("CHANGED TO", priorityLabel, true),
        ].join(""),
        extraBlockHtml: noteBlock(
          previousPriorityLabel
            ? `Ticket priority has been changed from ${previousPriorityLabel} to ${priorityLabel}.`
            : `Ticket priority has been changed to ${priorityLabel}.`
        ),
        summaryLeft: "URGENCY",
        summaryRight: priorityLabel,
        summaryRightSize: "22px",
        summaryRightColor: "#c1121f",
        ctaText: "OPEN IN ADMIN →",
        footerLeft: "needs attention",
        buttonColor: "#c1121f",
      };
  }
}

export function statusToEvent(
  status: TicketStatus,
  previousStatus?: TicketStatus
): TicketEmailEvent | null {
  if (previousStatus && (previousStatus === "resolved" || previousStatus === "closed") && status === "open") {
    return "reopened";
  }

  const map: Partial<Record<TicketStatus, TicketEmailEvent>> = {
    in_progress: "in_progress",
    waiting_on_user: "waiting_on_user",
    resolved: "resolved",
    closed: "closed",
  };

  return map[status] ?? null;
}
