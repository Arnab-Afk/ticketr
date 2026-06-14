import { formatTicketNumber } from "@/lib/ticket-format";
import type { Ticket } from "@/lib/types/ticket";
import {
  PriorityBadge,
  StatusBadge,
  formatRelativeTime,
} from "@/components/tickets/ticket-badges";
import { ReceiptPaper } from "@/components/receipt/receipt-paper";

export function TicketDetailHeader({ ticket }: { ticket: Ticket }) {
  return (
    <ReceiptPaper width="full" className="p-6">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="receipt-label text-[10px]">
          #{formatTicketNumber(ticket.id)}
        </span>
        <StatusBadge status={ticket.status} />
        <span className="receipt-label text-[10px] text-muted-foreground">
          {ticket.category.name}
        </span>
        <PriorityBadge priority={ticket.priority} />
      </div>
      <h1 className="text-2xl font-bold text-primary">{ticket.subject}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Opened {new Date(ticket.createdAt).toLocaleString()}
        {" · "}
        Updated {formatRelativeTime(ticket.updatedAt)}
      </p>
      {ticket.assignee ? (
        <p className="mt-1 text-sm text-muted-foreground">
          Assigned to {ticket.assignee.fullName}
        </p>
      ) : null}
      <p className="mt-4 whitespace-pre-wrap border-t border-dashed border-border pt-4 text-sm leading-relaxed">
        {ticket.description}
      </p>
    </ReceiptPaper>
  );
}
