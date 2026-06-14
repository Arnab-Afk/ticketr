"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { ReceiptPaper } from "@/components/receipt/receipt-paper";
import { apiClient } from "@/lib/api-client";
import { priorityDescriptions } from "@/lib/ticket-format";
import type { TicketCategory, TicketPriority } from "@/lib/types/ticket";

export default function PublicSupportPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("normal");
  const [attachmentIds, setAttachmentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiClient.get<TicketCategory[]>("/api/categories").then((res) => {
      if (res.success && res.data) {
        setCategories(res.data);
        if (res.data[0]) setCategoryId(res.data[0].id);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const response = await apiClient.post<{ publicUrl: string }>(
      "/api/tickets/public",
      {
        fullName,
        email,
        subject,
        description,
        categoryId,
        priority,
        attachmentIds,
      }
    );

    setLoading(false);

    if (response.success && response.data?.publicUrl) {
      router.push(response.data.publicUrl);
      return;
    }

    setError(response.error ?? "Failed to submit ticket");
  };

  const selectedCategory = categories.find((c) => c.id === categoryId);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h1 className="page-title">Get support</h1>
        <p className="page-subtitle mt-2">
          Submit a request without an account. We&apos;ll email you a link to
          track your ticket.
        </p>
      </div>

      <ReceiptPaper width="full" className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="receipt-label">
                Your name
              </Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="receipt-label">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject" className="receipt-label">
              Subject
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
            <Label htmlFor="description" className="receipt-label">
              How can we help?
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              required
            />
          </div>

          <AttachmentUploader
            onChange={setAttachmentIds}
            guestEmail={email}
            guestName={fullName}
            disabled={!email || !fullName}
          />
          {!email || !fullName ? (
            <p className="text-xs text-muted-foreground">
              Enter your name and email before attaching files.
            </p>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? "Submitting..." : "Submit request"}
          </Button>
        </form>
      </ReceiptPaper>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Have an account?{" "}
        <Link href="/login" className="font-bold text-primary hover:underline">
          Sign in to view all tickets
        </Link>
      </p>
    </main>
  );
}
