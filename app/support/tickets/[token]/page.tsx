"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MessageThread } from "@/components/tickets/message-thread";
import { ReplyBox } from "@/components/tickets/reply-box";
import { PriorityBadge, StatusBadge } from "@/components/tickets/ticket-badges";
import { AttachmentList } from "@/components/tickets/attachment-uploader";
import { apiClient } from "@/lib/api-client";
import type { Ticket } from "@/lib/types/ticket";

export default function PublicTicketPage() {
  const params = useParams<{ token: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTicket = useCallback(async () => {
    const response = await apiClient.get<Ticket>(
      `/api/tickets/public?token=${params.token}`
    );
    if (response.success && response.data) {
      setTicket(response.data);
    } else {
      setError(response.error ?? "Ticket not found");
    }
    setLoading(false);
  }, [params.token]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  const handleReply = async (
    body: string,
    _isInternal?: boolean,
    attachmentIds?: string[]
  ) => {
    await apiClient.post(`/api/tickets/public/${params.token}/messages`, {
      body,
      attachmentIds,
    });
    await loadTicket();
  };

  if (loading) {
    return (
      <main className="mx-auto flex max-w-3xl items-center justify-center px-4 py-24">
        <div className="size-12 animate-spin rounded-full border-4 border-[#167E6C] border-t-transparent" />
      </main>
    );
  }

  if (error || !ticket) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-red-600">{error || "Ticket not found"}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          <span className="text-sm text-gray-500">{ticket.category.name}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
        <p className="mt-2 text-sm text-gray-500">
          Submitted {new Date(ticket.createdAt).toLocaleString()}
        </p>
        {ticket.attachments?.length ? (
          <div className="mt-4">
            <AttachmentList attachments={ticket.attachments} />
          </div>
        ) : null}
      </div>

      <div className="space-y-6">
        <MessageThread messages={ticket.messages ?? []} currentUserId="" />

        {ticket.status !== "closed" ? (
          <ReplyBox
            onSubmit={handleReply}
            publicToken={params.token}
            guestEmail={ticket.guestEmail ?? ticket.creator.email}
            guestName={ticket.creator.fullName}
          />
        ) : (
          <p className="text-sm text-gray-500">This ticket is closed.</p>
        )}
      </div>
    </main>
  );
}
