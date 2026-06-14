import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/app-shell";
import {
  ReceiptDivider,
  ReceiptMeta,
  ReceiptSectionTitle,
} from "@/components/receipt/receipt-paper";

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    if (session.user.role === "admin" || session.user.role === "agent") {
      redirect("/admin");
    }
    redirect("/tickets");
  }

  return (
    <AppShell>
      <div className="px-4 py-10 sm:px-8 sm:py-14">
        <ReceiptMeta left="TICKETR v1.0" right="OPEN SOURCE" />

        <h1 className="mt-8 max-w-3xl text-3xl font-bold leading-tight text-primary sm:text-5xl">
          Support tickets that don&apos;t feel like{" "}
          <span className="underline decoration-primary/30 decoration-2 underline-offset-4">
            legacy software
          </span>
          .
        </h1>

        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Self-hosted help desk for hackathons, startups, and teams who want a
          clean UI without the bloat.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" asChild>
            <Link href="/register">Create account</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/support/new">Submit without account</Link>
          </Button>
        </div>

        <ReceiptDivider />

        <ReceiptSectionTitle>Features</ReceiptSectionTitle>

        <div className="mt-4 grid gap-px border border-border bg-border sm:grid-cols-3">
          {[
            {
              title: "Clean UI",
              description:
                "Receipt-style cards, status badges, and chat threads.",
            },
            {
              title: "Participant portal",
              description:
                "Users create tickets, track status, and reply in a simple inbox.",
            },
            {
              title: "Admin queue",
              description:
                "Agents assign, respond, add internal notes, and close tickets fast.",
            },
          ].map(({ title, description }) => (
            <div key={title} className="bg-card p-5">
              <p className="receipt-label text-[10px]">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>

        <ReceiptDivider dashed={false} />

        <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
          MIT licensed · self-hostable
        </p>
      </div>
    </AppShell>
  );
}
