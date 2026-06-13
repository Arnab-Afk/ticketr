import type { TicketPriority, TicketStatus } from "@/lib/types/ticket";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  TicketStatus,
  { label: string; className: string }
> = {
  open: { label: "Open", className: "bg-blue-50 text-blue-700 border-blue-200" },
  in_progress: {
    label: "In Progress",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  waiting_on_user: {
    label: "Waiting on User",
    className: "bg-purple-50 text-purple-700 border-purple-200",
  },
  resolved: {
    label: "Resolved",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  closed: { label: "Closed", className: "bg-gray-100 text-gray-600 border-gray-200" },
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
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}

const priorityConfig: Record<
  TicketPriority,
  { label: string; className: string }
> = {
  low: { label: "Low", className: "text-gray-500" },
  normal: { label: "Normal", className: "text-gray-700" },
  high: { label: "High", className: "text-orange-600" },
  urgent: { label: "Urgent", className: "text-red-600 font-semibold" },
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
    <span className={cn("text-xs font-medium", config.className, className)}>
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
