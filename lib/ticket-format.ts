import type { TicketPriority, TicketStatus } from "@/lib/types/ticket";

export function formatTicketNumber(ticketId: string): string {
  return ticketId.slice(-6).toUpperCase();
}

export const statusDescriptions: Record<TicketStatus, string> = {
  open: "Your ticket is in the queue. We'll pick it up soon.",
  in_progress: "A team member is actively working on this.",
  waiting_on_user: "We need your reply to continue — check the thread below.",
  resolved: "This ticket is closed. No further replies can be added.",
  closed: "This ticket is closed. No further replies can be added.",
};

export function isTicketClosed(status: TicketStatus): boolean {
  return status === "closed" || status === "resolved";
}

export const priorityDescriptions: Record<TicketPriority, string> = {
  low: "General question — no rush",
  normal: "Standard request",
  high: "Important — affects your work",
  urgent: "Critical — needs immediate attention",
};

export function ticketNeedsUserAction(status: TicketStatus): boolean {
  return status === "waiting_on_user" || status === "open";
}
