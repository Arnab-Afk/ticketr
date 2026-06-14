"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { TicketCard } from "@/components/tickets/ticket-card";
import {
  TicketFilters,
  buildTicketQuery,
} from "@/components/tickets/ticket-filters";
import { apiClient } from "@/lib/api-client";
import type { Ticket } from "@/lib/types/ticket";

export default function TicketsPage() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const response = await apiClient.get<Ticket[]>(
        `/api/tickets${buildTicketQuery(status, search)}`
      );
      if (response.success && response.data) {
        setTickets(response.data);
        setError("");
      } else {
        setError(response.error ?? "Failed to load tickets");
      }
      setLoading(false);
    }

    const timeout = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [status, search]);

  const openCount = tickets.filter((t) =>
    ["open", "waiting_on_user"].includes(t.status)
  ).length;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title">My Tickets</h1>
          <p className="page-subtitle mt-1">
            {session?.user?.name
              ? `Welcome, ${session.user.name}`
              : "Your support requests"}
            {!loading && tickets.length > 0
              ? ` · ${tickets.length} ticket${tickets.length === 1 ? "" : "s"}`
              : ""}
            {openCount > 0 ? ` · ${openCount} need attention` : ""}
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/tickets/new">New ticket</Link>
        </Button>
      </div>

      <div className="mb-6">
        <TicketFilters
          status={status}
          search={search}
          onStatusChange={setStatus}
          onSearchChange={setSearch}
          onClear={() => {
            setStatus("all");
            setSearch("");
          }}
        />
      </div>

      {error ? (
        <div className="receipt-panel border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="receipt-spinner size-10" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="receipt-panel border-dashed p-12 text-center">
          <p className="font-bold text-primary">
            {status !== "all" || search
              ? "No tickets match your filters"
              : "No tickets yet"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {status !== "all" || search
              ? "Try clearing filters or broadening your search."
              : "Create a ticket and we'll follow up by email."}
          </p>
          {status !== "all" || search ? (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setStatus("all");
                setSearch("");
              }}
            >
              Clear filters
            </Button>
          ) : (
            <Button asChild className="mt-4">
              <Link href="/tickets/new">Create your first ticket</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              href={`/tickets/${ticket.id}`}
            />
          ))}
        </div>
      )}
    </main>
  );
}
