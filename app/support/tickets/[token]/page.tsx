"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MessageThread } from "@/components/tickets/message-thread";
import { ReplyBox } from "@/components/tickets/reply-box";
import { StatusHint } from "@/components/tickets/status-hint";
import { TicketDetailHeader } from "@/components/tickets/ticket-detail-header";
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
    const response = await apiClient.post(
      `/api/tickets/public/${params.token}/messages`,
      {
        body,
        attachmentIds,
      }
    );
    if (!response.success) {
      throw new Error(response.error ?? "Failed to send reply");
    }
    await loadTicket();
  };

  if (loading) {
    return (
      <main className="mx-auto flex max-w-3xl items-center justify-center px-4 py-24">
        <div className="receipt-spinner size-12" />
      </main>
    );
  }

  if (error || !ticket) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-destructive">{error || "Ticket not found"}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Check the link in your email — it may have expired or been mistyped.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="space-y-4">
        <TicketDetailHeader ticket={ticket} />
        <StatusHint status={ticket.status} />
      </div>

      {ticket.attachments?.length ? (
        <div className="mt-4">
          <AttachmentList attachments={ticket.attachments} />
        </div>
      ) : null}

      <div className="mt-6 space-y-6">
        <section>
          <h2 className="receipt-label mb-3 text-[10px]">Conversation</h2>
          <MessageThread messages={ticket.messages ?? []} currentUserId="" />
        </section>

        {ticket.status !== "closed" ? (
          <ReplyBox
            onSubmit={handleReply}
            publicToken={params.token}
            guestEmail={ticket.guestEmail ?? ticket.creator.email}
            guestName={ticket.creator.fullName}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            This ticket is closed. Submit a new request if you need more help.
          </p>
        )}
      </div>
    </main>
  );
}
