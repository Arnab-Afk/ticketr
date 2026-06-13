"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AttachmentUploader } from "@/components/tickets/attachment-uploader";
import type { CannedResponse } from "@/lib/types/ticket";

export function ReplyBox({
  onSubmit,
  allowInternal = false,
  placeholder = "Write a reply...",
  cannedResponses = [],
  publicToken,
  guestEmail,
  guestName,
}: {
  onSubmit: (
    body: string,
    isInternal?: boolean,
    attachmentIds?: string[]
  ) => Promise<void>;
  allowInternal?: boolean;
  placeholder?: string;
  cannedResponses?: CannedResponse[];
  publicToken?: string;
  guestEmail?: string;
  guestName?: string;
}) {
  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attachmentIds, setAttachmentIds] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!body.trim() && attachmentIds.length === 0) || loading) return;

    setLoading(true);
    try {
      await onSubmit(
        body.trim(),
        allowInternal ? isInternal : false,
        attachmentIds
      );
      setBody("");
      setIsInternal(false);
      setAttachmentIds([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
    >
      {cannedResponses.length > 0 ? (
        <div className="space-y-2">
          <Label className="text-xs text-gray-500">Canned response</Label>
          <Select
            onValueChange={(id) => {
              const picked = cannedResponses.find((c) => c.id === id);
              if (picked) setBody(picked.body);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Insert a saved reply..." />
            </SelectTrigger>
            <SelectContent>
              {cannedResponses.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div>
        <Label htmlFor="reply" className="sr-only">
          Reply
        </Label>
        <Textarea
          id="reply"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="resize-none"
        />
      </div>

      <AttachmentUploader
        onChange={setAttachmentIds}
        publicToken={publicToken}
        guestEmail={guestEmail}
        guestName={guestName}
        disabled={loading}
      />

      <div className="flex items-center justify-between gap-3">
        {allowInternal ? (
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className="rounded border-gray-300"
            />
            Internal note
          </label>
        ) : (
          <span />
        )}
        <Button
          type="submit"
          disabled={loading || (!body.trim() && attachmentIds.length === 0)}
        >
          {loading ? "Sending..." : "Send reply"}
        </Button>
      </div>
    </form>
  );
}
