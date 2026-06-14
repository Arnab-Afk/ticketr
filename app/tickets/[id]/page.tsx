"use client";

import Link from "next/link";
import { Suspense, useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { MessageThread } from "@/components/tickets/message-thread";
import { ReplyBox } from "@/components/tickets/reply-box";
import { StatusHint } from "@/components/tickets/status-hint";
import { TicketDetailHeader } from "@/components/tickets/ticket-detail-header";
import { apiClient } from "@/lib/api-client";
import type { Ticket } from "@/lib/types/ticket";

function TicketDetailContent() {
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
    if (!response.success) {
      throw new Error(response.error ?? "Failed to send reply");
    }
    await loadTicket();
  };

  if (loading) {
    return (
      <main className="mx-auto flex max-w-4xl items-center justify-center px-4 py-24">
        <div className="receipt-spinner size-12" />
      </main>
    );
  }

  if (error || !ticket) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-destructive">{error || "Ticket not found"}</p>
        <Link
          href="/tickets"
          className="mt-4 inline-block text-primary hover:underline"
        >
          Back to tickets
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/tickets"
        className="text-sm text-muted-foreground hover:text-primary"
      >
        ← Back to tickets
      </Link>

      <div className="mt-4 space-y-4">
        <TicketDetailHeader ticket={ticket} />
        <StatusHint status={ticket.status} />
      </div>

      <div className="mt-6 space-y-6">
        <section>
          <h2 className="receipt-label mb-3 text-[10px]">Conversation</h2>
          <MessageThread
            messages={ticket.messages ?? []}
            currentUserId={session?.user?.id ?? ""}
          />
        </section>
        {ticket.status !== "closed" ? (
          <ReplyBox onSubmit={handleReply} />
        ) : (
          <p className="text-sm text-muted-foreground">
            This ticket is closed. Open a new ticket if you need more help.
          </p>
        )}
      </div>
    </main>
  );
}

export default function TicketDetailPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex max-w-4xl items-center justify-center px-4 py-24">
          <div className="receipt-spinner size-12" />
        </main>
      }
    >
      <TicketDetailContent />
    </Suspense>
  );
}
