"use client";

import Link from "next/link";
import { ReceiptPaper } from "@/components/receipt/receipt-paper";
import { NewTicketForm } from "@/components/tickets/new-ticket-form";
import { useRouter } from "next/navigation";

export default function NewTicketPage() {
  const router = useRouter();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href="/tickets"
          className="text-sm text-muted-foreground hover:text-primary"
        >
          ← Back to tickets
        </Link>
        <h1 className="page-title mt-2">New ticket</h1>
        <p className="page-subtitle mt-1">
          Describe your issue and we&apos;ll get back to you.
        </p>
      </div>

      <ReceiptPaper width="full" className="p-6">
        <NewTicketForm
          onSuccess={(ticket) => router.push(`/tickets/${ticket.id}`)}
        />
      </ReceiptPaper>
    </main>
  );
}
