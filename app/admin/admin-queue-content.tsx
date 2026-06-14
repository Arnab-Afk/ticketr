"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  StatusBadge,
  formatRelativeTime,
} from "@/components/tickets/ticket-badges";
import {
  ReceiptPaper,
  ReceiptStat,
  ReceiptStatStrip,
} from "@/components/receipt/receipt-paper";
import {
  TicketFilters,
  buildTicketQuery,
} from "@/components/tickets/ticket-filters";
import { formatTicketNumber } from "@/lib/ticket-format";
import { apiClient } from "@/lib/api-client";
import type { Ticket } from "@/lib/types/ticket";
import { cn } from "@/lib/utils";

export default function AdminQueuePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? "all";
  const search = searchParams.get("search") ?? "";

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState({ open: 0, inProgress: 0, waiting: 0 });
  const [loading, setLoading] = useState(true);

  const updateFilters = useCallback(
    (next: { status?: string; search?: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      const newStatus = next.status ?? status;
      const newSearch = next.search ?? search;

      if (newStatus === "all") params.delete("status");
      else params.set("status", newStatus);

      if (newSearch.trim()) params.set("search", newSearch.trim());
      else params.delete("search");

      const qs = params.toString();
      router.replace(qs ? `/admin?${qs}` : "/admin", { scroll: false });
    },
    [router, searchParams, status, search]
  );

  useEffect(() => {
    apiClient.get<Ticket[]>("/api/tickets?limit=100").then((response) => {
      if (response.success && response.data) {
        const all = response.data;
        setStats({
          open: all.filter((t) => t.status === "open").length,
          inProgress: all.filter((t) => t.status === "in_progress").length,
          waiting: all.filter((t) => t.status === "waiting_on_user").length,
        });
      }
    });
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const response = await apiClient.get<Ticket[]>(
        `/api/tickets${buildTicketQuery(status, search)}`
      );
      if (response.success && response.data) {
        setTickets(response.data);
      }
      setLoading(false);
    }

    const timeout = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [status, search]);

  const statFilters = [
    { label: "Open", value: stats.open, status: "open" },
    { label: "In progress", value: stats.inProgress, status: "in_progress" },
    {
      label: "Waiting on user",
      value: stats.waiting,
      status: "waiting_on_user",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="page-title">Ticket queue</h1>
        <p className="page-subtitle mt-1">
          Manage and respond to support requests
        </p>
      </div>

      <ReceiptStatStrip className="mb-6 max-w-lg">
        {statFilters.map((stat) => (
          <button
            key={stat.status}
            type="button"
            onClick={() =>
              updateFilters({
                status: status === stat.status ? "all" : stat.status,
              })
            }
            className={cn(
              "receipt-stat w-full text-left transition-opacity hover:opacity-80",
              status === stat.status && "bg-primary/5"
            )}
          >
            <ReceiptStat label={stat.label} value={stat.value} />
          </button>
        ))}
      </ReceiptStatStrip>

      <div className="mb-4">
        <TicketFilters
          status={status}
          search={search}
          onStatusChange={(value) => updateFilters({ status: value })}
          onSearchChange={(value) => updateFilters({ search: value })}
          onClear={() => updateFilters({ status: "all", search: "" })}
        />
      </div>

      <ReceiptPaper width="full" className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="receipt-spinner size-10" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-bold text-primary">No tickets found</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try adjusting filters or search terms.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="receipt-label text-[10px]">ID</TableHead>
                <TableHead className="receipt-label text-[10px]">
                  Subject
                </TableHead>
                <TableHead className="receipt-label text-[10px]">
                  Requester
                </TableHead>
                <TableHead className="receipt-label text-[10px]">
                  Category
                </TableHead>
                <TableHead className="receipt-label text-[10px]">
                  Status
                </TableHead>
                <TableHead className="receipt-label text-[10px]">
                  Updated
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow
                  key={ticket.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/admin/tickets/${ticket.id}`)}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {formatTicketNumber(ticket.id)}
                  </TableCell>
                  <TableCell className="max-w-xs truncate font-medium">
                    {ticket.subject}
                  </TableCell>
                  <TableCell>{ticket.creator.fullName}</TableCell>
                  <TableCell>{ticket.category.name}</TableCell>
                  <TableCell>
                    <StatusBadge status={ticket.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatRelativeTime(ticket.updatedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ReceiptPaper>

      {!loading && tickets.length > 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Click a row to open the ticket. Filters are saved in the URL — bookmark
          this page to return to the same view.
        </p>
      ) : null}
    </div>
  );
}
