"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AttachmentUploader } from "@/components/tickets/attachment-uploader";
import { apiClient } from "@/lib/api-client";
import { priorityDescriptions } from "@/lib/ticket-format";
import type { Ticket, TicketCategory, TicketPriority } from "@/lib/types/ticket";

export function NewTicketForm({
  idPrefix = "ticket",
  compact = false,
  onSuccess,
  onCancel,
}: {
  idPrefix?: string;
  compact?: boolean;
  onSuccess?: (ticket: Ticket) => void;
  onCancel?: () => void;
}) {
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("normal");
  const [attachmentIds, setAttachmentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const response = await apiClient.get<TicketCategory[]>("/api/categories");
      if (response.success && response.data) {
        setCategories(response.data);
        if (response.data[0]) setCategoryId(response.data[0].id);
      }
    }
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const response = await apiClient.post<Ticket>("/api/tickets", {
      subject,
      description,
      categoryId,
      priority,
      attachmentIds,
    });

    setLoading(false);

    if (response.success && response.data) {
      onSuccess?.(response.data);
      return;
    }

    setError(response.error ?? "Failed to create ticket");
  };

  const selectedCategory = categories.find((c) => c.id === categoryId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-subject`} className="receipt-label">
          Subject
        </Label>
        <Input
          id={`${idPrefix}-subject`}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Brief summary of your issue"
          required
        />
      </div>

      <div className={compact ? "space-y-4" : "grid gap-4 sm:grid-cols-2"}>
        <div className="space-y-2">
          <Label className="receipt-label">Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCategory?.description ? (
            <p className="text-xs text-muted-foreground">
              {selectedCategory.description}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label className="receipt-label">Priority</Label>
          <Select
            value={priority}
            onValueChange={(v) => setPriority(v as TicketPriority)}
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
          <p className="text-xs text-muted-foreground">
            {priorityDescriptions[priority]}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-description`} className="receipt-label">
          Description
        </Label>
        <Textarea
          id={`${idPrefix}-description`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Provide as much detail as possible..."
          rows={compact ? 4 : 6}
          required
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <AttachmentUploader onChange={setAttachmentIds} disabled={loading} />

      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit ticket"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" disabled={loading} onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
