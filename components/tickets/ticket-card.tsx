import Link from "next/link";
import type { Ticket } from "@/lib/types/ticket";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatRelativeTime,
  PriorityBadge,
  StatusBadge,
} from "@/components/tickets/ticket-badges";
import { MessageSquare } from "lucide-react";

export function TicketCard({
  ticket,
  href,
}: {
  ticket: Ticket;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="rounded-2xl border-gray-100 shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={ticket.status} />
                <span className="text-xs text-gray-500">{ticket.category.name}</span>
                <PriorityBadge priority={ticket.priority} />
              </div>
              <h3 className="truncate text-base font-semibold text-gray-900">
                {ticket.subject}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                {ticket.description}
              </p>
            </div>
            <div className="shrink-0 text-right text-xs text-gray-400">
              <p>{formatRelativeTime(ticket.updatedAt)}</p>
              {ticket._count?.messages ? (
                <p className="mt-2 flex items-center justify-end gap-1">
                  <MessageSquare className="size-3.5" />
                  {ticket._count.messages}
                </p>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
