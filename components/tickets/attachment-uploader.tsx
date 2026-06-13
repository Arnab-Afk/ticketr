"use client";

import { useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TicketAttachment } from "@/lib/types/ticket";

interface PendingFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

export function AttachmentUploader({
  onChange,
  publicToken,
  guestEmail,
  guestName,
  disabled,
}: {
  onChange: (ids: string[]) => void;
  publicToken?: string;
  guestEmail?: string;
  guestName?: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError("");

    const params = new URLSearchParams();
    if (publicToken) params.set("token", publicToken);
    if (guestEmail) params.set("email", guestEmail);
    if (guestName) params.set("name", guestName);
    const query = params.toString() ? `?${params.toString()}` : "";

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/upload/attachment${query}`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!data.success || !data.data) {
        setError(data.error ?? "Upload failed");
        return;
      }

      const attachment = data.data as TicketAttachment;
      const next = [
        ...files,
        {
          id: attachment.id,
          fileName: attachment.fileName,
          fileUrl: attachment.fileUrl,
          fileSize: attachment.fileSize,
          mimeType: attachment.mimeType,
        },
      ];
      setFiles(next);
      onChange(next.map((f) => f.id));
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (id: string) => {
    const next = files.filter((f) => f.id !== id);
    setFiles(next);
    onChange(next.map((f) => f.id));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.txt"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadFile(file);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Paperclip className="size-4" />
          {uploading ? "Uploading..." : "Attach file"}
        </Button>
        {files.map((file) => (
          <span
            key={file.id}
            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
          >
            {file.fileName}
            <button type="button" onClick={() => removeFile(file.id)}>
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

export function AttachmentList({
  attachments,
}: {
  attachments: TicketAttachment[];
}) {
  if (!attachments.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {attachments.map((file) => (
        <a
          key={file.id}
          href={file.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-[#167E6C] hover:bg-gray-100"
        >
          <Paperclip className="size-3" />
          {file.fileName}
        </a>
      ))}
    </div>
  );
}
