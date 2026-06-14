import Link from "next/link";
import type { Ticket } from "@/lib/types/ticket";
import {
  formatTicketNumber,
  ticketNeedsUserAction,
} from "@/lib/ticket-format";
import {
  formatRelativeTime,
  PriorityBadge,
  StatusBadge,
} from "@/components/tickets/ticket-badges";
import { cn } from "@/lib/utils";

export function TicketCard({
  ticket,
  href,
}: {
  ticket: Ticket;
  href: string;
}) {
  const needsAction = ticketNeedsUserAction(ticket.status);

  return (
    <Link href={href} className="block">
      <div
        className={cn(
          "receipt-panel transition-colors hover:border-primary/40",
          needsAction && "border-primary/30 bg-primary/[0.03]"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="receipt-label text-[10px] text-muted-foreground">
                #{formatTicketNumber(ticket.id)}
              </span>
              <StatusBadge status={ticket.status} />
              <span className="text-[10px] font-bold tracking-wide uppercase text-muted-foreground">
                {ticket.category.name}
              </span>
              <PriorityBadge priority={ticket.priority} />
            </div>
            <h3 className="truncate text-base font-bold text-primary">
              {ticket.subject}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {ticket.description}
            </p>
            {needsAction && ticket.status === "waiting_on_user" ? (
              <p className="mt-2 text-xs font-bold uppercase tracking-wide text-primary">
                Reply needed
              </p>
            ) : null}
          </div>
          <div className="shrink-0 text-right text-xs text-muted-foreground">
            <p>{formatRelativeTime(ticket.updatedAt)}</p>
            {ticket._count?.messages ? (
              <p className="mt-2 font-bold uppercase tracking-wide">
                {ticket._count.messages} msg
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
