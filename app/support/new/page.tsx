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
import { apiClient } from "@/lib/api-client";
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

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Get support</h1>
        <p className="mt-2 text-gray-600">
          Submit a request without an account. We&apos;ll email you a link to track your ticket.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Your name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
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
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
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
          <Label htmlFor="description">How can we help?</Label>
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
          <p className="text-xs text-gray-500">Enter your name and email before attaching files.</p>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? "Submitting..." : "Submit request"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Have an account?{" "}
        <Link href="/login" className="font-medium text-[#167E6C] hover:underline">
          Sign in to view all tickets
        </Link>
      </p>
    </main>
  );
}
