import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Inbox, Shield, Sparkles } from "lucide-react";

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    if (session.user.role === "admin" || session.user.role === "agent") {
      redirect("/admin");
    }
    redirect("/tickets");
  }

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <span className="text-xl font-bold text-gray-900">ticketr</span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#167E6C]">
              Open source ticketing
            </p>
            <h1 className="text-5xl font-black leading-tight text-gray-900 sm:text-6xl">
              Support tickets that don&apos;t feel like legacy software.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
              ticketr is a modern, self-hosted help desk for hackathons, startups,
              and teams who want a clean UI without the bloat.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link href="/register">
                  Create account
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/support/new">Submit without account</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="border-t border-gray-100 bg-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:grid-cols-3 sm:px-6">
            {[
              {
                icon: Sparkles,
                title: "Clean UI",
                description:
                  "Cards, status badges, and chat-style threads — no cluttered enterprise dashboards.",
              },
              {
                icon: Inbox,
                title: "Participant portal",
                description:
                  "Users create tickets, track status, and reply in a simple inbox.",
              },
              {
                icon: Shield,
                title: "Admin queue",
                description:
                  "Agents assign, respond, add internal notes, and close tickets fast.",
              },
            ].map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-2xl border border-gray-100 p-6 shadow-sm"
              >
                <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-[#167E6C]/10 text-[#167E6C]">
                  <Icon className="size-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-500">
        ticketr — MIT licensed, self-hostable
      </footer>
    </div>
  );
}
