import type { TicketPriority, TicketStatus } from "@/lib/types/ticket";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  TicketStatus,
  { label: string; className: string }
> = {
  open: {
    label: "Open",
    className: "bg-primary/10 text-primary border-primary/40",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-amber-50 text-amber-900 border-amber-300",
  },
  waiting_on_user: {
    label: "Waiting on User",
    className: "bg-orange-50 text-orange-900 border-orange-300",
  },
  resolved: {
    label: "Resolved",
    className: "bg-emerald-50 text-emerald-900 border-emerald-300",
  },
  closed: {
    label: "Closed",
    className: "bg-muted text-muted-foreground border-border",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: TicketStatus;
  className?: string;
}) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn("rounded-none text-[10px] font-bold uppercase tracking-wide", config.className, className)}>
      {config.label}
    </Badge>
  );
}

const priorityConfig: Record<
  TicketPriority,
  { label: string; className: string }
> = {
  low: { label: "Low", className: "text-muted-foreground" },
  normal: { label: "Normal", className: "text-foreground" },
  high: { label: "High", className: "text-orange-700 font-bold" },
  urgent: { label: "Urgent", className: "text-primary font-bold uppercase" },
};

export function PriorityBadge({
  priority,
  className,
}: {
  priority: TicketPriority;
  className?: string;
}) {
  const config = priorityConfig[priority];
  return (
    <span className={cn("text-[10px] font-medium tracking-wide uppercase", config.className, className)}>
      {config.label}
    </span>
  );
}

export function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  }).format(date);
}
