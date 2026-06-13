"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MessageThread } from "@/components/tickets/message-thread";
import { StaffReplyBox } from "@/components/tickets/staff-reply-box";
import { PriorityBadge, StatusBadge } from "@/components/tickets/ticket-badges";
import { Button } from "@/components/ui/button";
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
    apiClient.get<StaffUser[]>("/api/users/staff").then((response) => {
      if (response.success && response.data) {
        setAgents(response.data);
      }
    });
  }, [loadTicket]);

  const updateTicket = async (data: Record<string, unknown>) => {
    const response = await apiClient.patch<Ticket>(`/api/tickets/${params.id}`, data);
    if (response.success && response.data) {
      setTicket((prev) => (prev ? { ...prev, ...response.data } : prev));
      await loadTicket();
    }
  };

  const handleReply = async (
    body: string,
    isInternal?: boolean,
    attachmentIds?: string[]
  ) => {
    await apiClient.post(`/api/tickets/${params.id}/messages`, {
      body,
      isInternal,
      attachmentIds,
    });
    await loadTicket();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="size-12 animate-spin rounded-full border-4 border-[#167E6C] border-t-transparent" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="px-4 py-8">
        <p className="text-red-600">{error || "Ticket not found"}</p>
        <Link href="/admin" className="mt-4 inline-block text-[#167E6C] hover:underline">
          Back to queue
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-900">
        ← Back to queue
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <span className="text-sm text-gray-500">{ticket.category.name}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
              {ticket.description}
            </p>
          </div>

          <MessageThread
            messages={ticket.messages ?? []}
            currentUserId=""
          />

          <StaffReplyBox onSubmit={handleReply} />
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Requester
            </h2>
            <p className="font-medium text-gray-900">{ticket.creator.fullName}</p>
            <p className="text-sm text-gray-500">{ticket.creator.email}</p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <Select
                value={ticket.status}
                onValueChange={(value) =>
                  updateTicket({ status: value as TicketStatus })
                }
              >
                <SelectTrigger>
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
              <label className="text-sm font-medium text-gray-700">Priority</label>
              <Select
                value={ticket.priority}
                onValueChange={(value) =>
                  updateTicket({ priority: value as TicketPriority })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Assignee</label>
              <Select
                value={ticket.assigneeId ?? "unassigned"}
                onValueChange={(value) =>
                  updateTicket({
                    assigneeId: value === "unassigned" ? null : value,
                  })
                }
              >
                <SelectTrigger>
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
              <p className="text-xs text-gray-500">
                Assigned to {ticket.assignee.fullName}
              </p>
            ) : null}
          </div>

          <Button variant="outline" className="w-full" asChild>
            <Link href={`/tickets/${ticket.id}`}>View as user</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
