"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GuestTicketForm } from "@/components/tickets/guest-ticket-form";
import { NewTicketForm } from "@/components/tickets/new-ticket-form";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/brand/ticketr-logo.png";

const HIDDEN_PATHS = ["/tickets/new", "/support/new"];

function SupportWidgetInner() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  const isAuthed = !!session?.user?.id;
  const isLoading = status === "loading";

  if (HIDDEN_PATHS.includes(pathname)) {
    return null;
  }

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "fixed bottom-6 right-6 z-[9999] rounded-none border-0 bg-transparent p-0 shadow-none",
            "transition-transform hover:scale-105",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          )}
          aria-label="Create a support ticket"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_SRC}
            alt="ticketr — new ticket"
            width={152}
            height={119}
            className="pointer-events-none block h-16 w-auto max-w-none drop-shadow-lg sm:h-[4.5rem]"
          />
        </button>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none border-border bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="page-title text-xl">
              {isAuthed ? "New ticket" : "Get support"}
            </DialogTitle>
            <DialogDescription>
              {isAuthed
                ? "Describe your issue and we'll get back to you."
                : "Submit a request without an account. We'll email you a link to track it."}
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="receipt-spinner size-8" />
            </div>
          ) : isAuthed ? (
            <NewTicketForm
              idPrefix="widget"
              compact
              onCancel={() => setOpen(false)}
              onSuccess={(ticket) => {
                setOpen(false);
                router.push(`/tickets/${ticket.id}`);
              }}
            />
          ) : (
            <GuestTicketForm
              idPrefix="widget-guest"
              compact
              onCancel={() => setOpen(false)}
              onSuccess={(publicUrl) => {
                setOpen(false);
                router.push(publicUrl);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Renders the floating widget on document.body so it is never clipped by layout. */
export function SupportWidget() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(<SupportWidgetInner />, document.body);
}
