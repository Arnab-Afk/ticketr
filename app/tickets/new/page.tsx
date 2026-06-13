"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import type { Ticket, TicketCategory, TicketPriority } from "@/lib/types/ticket";

export default function NewTicketPage() {
  const router = useRouter();
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
      router.push(`/tickets/${response.data.id}`);
      return;
    }

    setError(response.error ?? "Failed to create ticket");
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href="/tickets" className="text-sm text-gray-500 hover:text-gray-900">
          ← Back to tickets
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">New ticket</h1>
        <p className="mt-1 text-gray-600">Describe your issue and we&apos;ll get back to you.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
      >
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief summary of your issue"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Category</Label>
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
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide as much detail as possible..."
            rows={6}
            required
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <AttachmentUploader onChange={setAttachmentIds} disabled={loading} />

        <Button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit ticket"}
        </Button>
      </form>
    </main>
  );
}
