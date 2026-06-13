"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { MessageThread } from "@/components/tickets/message-thread";
import { ReplyBox } from "@/components/tickets/reply-box";
import { PriorityBadge, StatusBadge } from "@/components/tickets/ticket-badges";
import { apiClient } from "@/lib/api-client";
import type { Ticket } from "@/lib/types/ticket";

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTicket = useCallback(async () => {
    const response = await apiClient.get<Ticket>(`/api/tickets/${params.id}`);
    if (response.success && response.data) {
      setTicket(response.data);
    } else {
      setError(response.error ?? "Failed to load ticket");
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  const handleReply = async (
    body: string,
    _isInternal?: boolean,
    attachmentIds?: string[]
  ) => {
    const response = await apiClient.post(`/api/tickets/${params.id}/messages`, {
      body,
      attachmentIds,
    });
    if (response.success) {
      await loadTicket();
    }
  };

  if (loading) {
    return (
      <main className="mx-auto flex max-w-4xl items-center justify-center px-4 py-24">
        <div className="size-12 animate-spin rounded-full border-4 border-[#167E6C] border-t-transparent" />
      </main>
    );
  }

  if (error || !ticket) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-red-600">{error || "Ticket not found"}</p>
        <Link href="/tickets" className="mt-4 inline-block text-[#167E6C] hover:underline">
          Back to tickets
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/tickets" className="text-sm text-gray-500 hover:text-gray-900">
        ← Back to tickets
      </Link>

      <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <StatusBadge status={ticket.status} />
          <span className="text-sm text-gray-500">{ticket.category.name}</span>
          <PriorityBadge priority={ticket.priority} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
        <p className="mt-2 text-sm text-gray-500">
          Opened {new Date(ticket.createdAt).toLocaleString()}
        </p>
      </div>

      <div className="mt-6 space-y-6">
        <MessageThread
          messages={ticket.messages ?? []}
          currentUserId={session?.user?.id ?? ""}
        />
        {ticket.status !== "closed" ? (
          <ReplyBox onSubmit={handleReply} />
        ) : (
          <p className="text-sm text-gray-500">This ticket is closed.</p>
        )}
      </div>
    </main>
  );
}
