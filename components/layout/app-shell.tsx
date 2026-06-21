"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { BrandLogo, SIDEBAR_LOGO_HEIGHT } from "@/components/receipt/brand-logo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type NavLink = {
  href: string;
  label: string;
  isActive: (pathname: string) => boolean;
};

const ticketLinks: NavLink[] = [
  {
    href: "/tickets",
    label: "My Tickets",
    isActive: (p) =>
      p === "/tickets" ||
      (p.startsWith("/tickets/") && p !== "/tickets/new"),
  },
  {
    href: "/tickets/new",
    label: "New Ticket",
    isActive: (p) => p === "/tickets/new",
  },
  {
    href: "/settings",
    label: "Change password",
    isActive: (p) => p.startsWith("/settings"),
  },
];

const staffLinks: NavLink[] = [
  {
    href: "/admin",
    label: "Queue",
    isActive: (p) => p === "/admin" || p.startsWith("/admin/"),
  },
];

const publicLinks: NavLink[] = [
  { href: "/", label: "Home", isActive: (p) => p === "/" },
  {
    href: "/support/new",
    label: "Submit request",
    isActive: (p) => p.startsWith("/support"),
  },
  { href: "/login", label: "Sign in", isActive: (p) => p === "/login" },
  { href: "/register", label: "Register", isActive: (p) => p === "/register" },
];

function SidebarContent({
  links,
  logoHref,
  panelLabel,
  isAuthed,
  session,
  onNavigate,
}: {
  links: NavLink[];
  logoHref: string;
  panelLabel: string;
  isAuthed: boolean;
  session: ReturnType<typeof useSession>["data"];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      <div className="border-b border-border p-5 sm:p-6">
        <BrandLogo href={logoHref} height={SIDEBAR_LOGO_HEIGHT} />
        <p className="receipt-label mt-2 text-[10px] text-muted-foreground">
          {panelLabel}
        </p>
      </div>

      <nav className="flex-1 space-y-1 p-3 sm:p-4">
        {links.map(({ href, label, isActive }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "block px-3 py-2.5 text-sm font-medium transition-colors",
              isActive(pathname)
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {label}
          </Link>
        ))}
        {isAuthed ? (
          <Link
            href="/tickets/new"
            onClick={onNavigate}
            className="mt-3 block border border-primary bg-primary px-3 py-2.5 text-center text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            + New ticket
          </Link>
        ) : null}
      </nav>

      <div className="border-t border-border p-3 sm:p-4">
        {isAuthed ? (
          <>
            <p className="truncate text-sm font-bold">{session?.user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {session?.user?.email}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 w-full justify-start"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Logout
            </Button>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            Self-hosted support ticketing
          </p>
        )}
      </div>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isStaff =
    session?.user?.role === "admin" || session?.user?.role === "agent";
  const isAuthed = !!session?.user?.id;
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const links = isAuthed
    ? [...(isStaff ? staffLinks : []), ...ticketLinks]
    : publicLinks;

  const logoHref = isStaff && isAuthed ? "/admin" : "/";
  const panelLabel = !isAuthed
    ? "Support"
    : isStaff
      ? "Admin panel"
      : "My account";

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="receipt-paper hidden w-56 shrink-0 flex-col border-r border-border bg-card sm:w-64 md:flex">
        <SidebarContent
          links={links}
          logoHref={logoHref}
          panelLabel={panelLabel}
          isAuthed={isAuthed}
          session={session}
        />
      </aside>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      ) : null}

      <aside
        className={cn(
          "receipt-paper fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent
          links={links}
          logoHref={logoHref}
          panelLabel={panelLabel}
          isAuthed={isAuthed}
          session={session}
          onNavigate={() => setMobileOpen(false)}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center border-b border-border bg-card px-4 py-3 md:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? "Close" : "Menu"}
          </Button>
        </div>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
