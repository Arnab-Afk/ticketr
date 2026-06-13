"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TicketCard } from "@/components/tickets/ticket-card";
import { apiClient } from "@/lib/api-client";
import type { Ticket } from "@/lib/types/ticket";

export default function TicketsPage() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const response = await apiClient.get<Ticket[]>("/api/tickets");
      if (response.success && response.data) {
        setTickets(response.data);
      } else {
        setError(response.error ?? "Failed to load tickets");
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <main className="mx-auto flex max-w-7xl items-center justify-center px-4 py-24">
        <div className="text-center">
          <div className="mx-auto mb-4 size-12 animate-spin rounded-full border-4 border-[#167E6C] border-t-transparent" />
          <p className="text-gray-600">Loading tickets...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Tickets</h1>
          <p className="mt-1 text-gray-600">
            {session?.user?.name ? `Welcome, ${session.user.name}` : "Your support requests"}
          </p>
        </div>
        <Button asChild>
          <Link href="/tickets/new">
            <Plus className="size-4" />
            New ticket
          </Link>
        </Button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {tickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-600">No tickets yet.</p>
          <Button asChild className="mt-4">
            <Link href="/tickets/new">Create your first ticket</Link>
          </Button>
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
