"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { MessageThread } from "@/components/tickets/message-thread";
import { ReplyBox } from "@/components/tickets/reply-box";
import { StatusHint } from "@/components/tickets/status-hint";
import { TicketDetailHeader } from "@/components/tickets/ticket-detail-header";
import { AttachmentList } from "@/components/tickets/attachment-uploader";
import { LoadingOverlay } from "@/components/ui/loading-block";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { isTicketClosed } from "@/lib/ticket-format";
import type { Ticket } from "@/lib/types/ticket";

function PublicTicketContent() {
  const params = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const accessToken = searchParams.get("access");

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [signInAttempted, setSignInAttempted] = useState(false);

  useEffect(() => {
    if (!accessToken || sessionStatus === "loading" || session?.user?.id) {
      return;
    }
    if (signInAttempted) return;

    setSignInAttempted(true);
    signIn("credentials", { accessToken, redirect: false }).then((result) => {
      if (result?.ok) {
        router.replace(`/support/tickets/${params.token}`, { scroll: false });
      }
    });
  }, [
    accessToken,
    sessionStatus,
    session?.user?.id,
    signInAttempted,
    params.token,
    router,
  ]);

  const loadTicket = useCallback(async (showOverlay = false) => {
    if (showOverlay) setRefreshing(true);
    const response = await apiClient.get<Ticket>(
      `/api/tickets/public?token=${params.token}`
    );
    if (response.success && response.data) {
      setTicket(response.data);
    } else {
      setError(response.error ?? "Ticket not found");
    }
    setLoading(false);
    setRefreshing(false);
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
    await loadTicket(true);
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

  const isSignedIn = !!session?.user?.id;
  const isStaff =
    session?.user?.role === "admin" || session?.user?.role === "agent";

  return (
    <main className="relative mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {refreshing ? <LoadingOverlay message="Updating conversation..." /> : null}

      {isSignedIn && !isStaff ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Signed in as {session.user.name}. View all your support requests.
          </p>
          <Button asChild size="sm" variant="outline">
            <Link href="/tickets">My tickets</Link>
          </Button>
        </div>
      ) : null}

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
          <MessageThread
            messages={ticket.messages ?? []}
            currentUserId={session?.user?.id ?? ""}
          />
        </section>

        {isTicketClosed(ticket.status) ? (
          <p className="text-sm text-muted-foreground">
            This ticket is closed. Submit a new request if you need more help.
          </p>
        ) : (
          <ReplyBox
            onSubmit={handleReply}
            publicToken={params.token}
            guestEmail={ticket.guestEmail ?? ticket.creator.email}
            guestName={ticket.creator.fullName}
          />
        )}
      </div>
    </main>
  );
}

export default function PublicTicketPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex max-w-3xl items-center justify-center px-4 py-24">
          <div className="receipt-spinner size-12" />
        </main>
      }
    >
      <PublicTicketContent />
    </Suspense>
  );
}
