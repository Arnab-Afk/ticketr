"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReceiptPaper } from "@/components/receipt/receipt-paper";
import { GuestTicketForm } from "@/components/tickets/guest-ticket-form";

export default function PublicSupportPage() {
  const router = useRouter();

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
        <GuestTicketForm
          onSuccess={(publicUrl) => router.push(publicUrl)}
        />
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
