"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MessageThread } from "@/components/tickets/message-thread";
import { StaffReplyBox } from "@/components/tickets/staff-reply-box";
import { StatusHint } from "@/components/tickets/status-hint";
import { TicketDetailHeader } from "@/components/tickets/ticket-detail-header";
import { priorityDescriptions } from "@/lib/ticket-format";
import { Button } from "@/components/ui/button";
import { ReceiptPaper } from "@/components/receipt/receipt-paper";
import { LoadingOverlay } from "@/components/ui/loading-block";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import type { Ticket, TicketPriority, TicketStatus } from "@/lib/types/ticket";

interface StaffUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export default function AdminTicketDetailPage() {
  const params = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [agents, setAgents] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const loadTicket = useCallback(async (showOverlay = false) => {
    if (showOverlay) setRefreshing(true);
    const response = await apiClient.get<Ticket>(`/api/tickets/${params.id}`);
    if (response.success && response.data) {
      setTicket(response.data);
    } else {
      setError(response.error ?? "Failed to load ticket");
    }
    setLoading(false);
    setRefreshing(false);
  }, [params.id]);

  useEffect(() => {
    loadTicket();
    apiClient.get<StaffUser[]>("/api/users/staff").then((response) => {
      if (response.success && response.data) {
        setAgents(response.data);
      }
    });
  }, [loadTicket]);

  const updateTicket = async (data: Record<string, unknown>) => {
    setUpdating(true);
    const response = await apiClient.patch<Ticket>(`/api/tickets/${params.id}`, data);
    if (response.success && response.data) {
      setTicket((prev) => (prev ? { ...prev, ...response.data } : prev));
      await loadTicket(true);
    }
    setUpdating(false);
  };

  const handleReply = async (
    body: string,
    isInternal?: boolean,
    attachmentIds?: string[]
  ) => {
    const response = await apiClient.post(`/api/tickets/${params.id}/messages`, {
      body,
      isInternal,
      attachmentIds,
    });
    if (!response.success) {
      throw new Error(response.error ?? "Failed to send reply");
    }
    await loadTicket(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="receipt-spinner size-12" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="px-4 py-8">
        <p className="text-destructive">{error || "Ticket not found"}</p>
        <Link
          href="/admin"
          className="mt-4 inline-block text-primary hover:underline"
        >
          Back to queue
        </Link>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {refreshing || updating ? (
        <LoadingOverlay
          message={updating ? "Saving changes..." : "Refreshing ticket..."}
        />
      ) : null}
      <Link
        href="/admin"
        className="text-sm text-muted-foreground hover:text-primary"
      >
        ← Back to queue
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <TicketDetailHeader ticket={ticket} />
          <StatusHint status={ticket.status} />

          <section>
            <h2 className="receipt-label mb-3 text-[10px]">Conversation</h2>
            <MessageThread messages={ticket.messages ?? []} currentUserId="" />
          </section>

          <StaffReplyBox onSubmit={handleReply} />
        </div>

        <aside className="space-y-4">
          <ReceiptPaper width="full" className="p-5">
            <h2 className="receipt-label mb-4 text-[10px] text-muted-foreground">
              Requester
            </h2>
            <p className="font-bold">{ticket.creator.fullName}</p>
            <p className="text-sm text-muted-foreground">
              {ticket.creator.email}
            </p>
          </ReceiptPaper>

          <ReceiptPaper width="full" className="space-y-4 p-5">
            <div className="space-y-2">
              <label className="receipt-label text-[10px]">Status</label>
              <Select
                value={ticket.status}
                disabled={updating}
                onValueChange={(value) =>
                  updateTicket({ status: value as TicketStatus })
                }
              >
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="waiting_on_user">Waiting on user</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="receipt-label text-[10px]">Priority</label>
              <Select
                value={ticket.priority}
                disabled={updating}
                onValueChange={(value) =>
                  updateTicket({ priority: value as TicketPriority })
                }
              >
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {priorityDescriptions[ticket.priority]}
              </p>
            </div>

            <div className="space-y-2">
              <label className="receipt-label text-[10px]">Assignee</label>
              <Select
                value={ticket.assigneeId ?? "unassigned"}
                disabled={updating}
                onValueChange={(value) =>
                  updateTicket({
                    assigneeId: value === "unassigned" ? null : value,
                  })
                }
              >
                <SelectTrigger className="bg-card">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {ticket.assignee ? (
              <p className="text-xs text-muted-foreground">
                Assigned to {ticket.assignee.fullName}
              </p>
            ) : null}
          </ReceiptPaper>

          <Button variant="outline" className="w-full bg-card" asChild>
            <Link href={`/tickets/${ticket.id}`}>View as user</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
