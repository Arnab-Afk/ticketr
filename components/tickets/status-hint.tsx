import type { TicketStatus } from "@/lib/types/ticket";
import { statusDescriptions, ticketNeedsUserAction } from "@/lib/ticket-format";
import { cn } from "@/lib/utils";

export function StatusHint({
  status,
  className,
}: {
  status: TicketStatus;
  className?: string;
}) {
  const needsAction = ticketNeedsUserAction(status);

  return (
    <div
      className={cn(
        "border border-dashed px-4 py-3 text-sm",
        needsAction
          ? "border-primary/40 bg-primary/5 text-foreground"
          : "border-border bg-muted/50 text-muted-foreground",
        className
      )}
    >
      <span className="receipt-label mr-2 text-[10px]">Status</span>
      {statusDescriptions[status]}
    </div>
  );
}
