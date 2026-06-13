"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LifeBuoy, LogOut, Plus, Shield } from "lucide-react";

const links = [
  { href: "/tickets", label: "My Tickets", icon: LifeBuoy },
  { href: "/tickets/new", label: "New Ticket", icon: Plus },
];

export function AppNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isStaff =
    session?.user?.role === "admin" || session?.user?.role === "agent";

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-lg font-bold text-gray-900">
            ticketr
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  pathname === href
                    ? "border-b-2 border-[#167E6C] pb-1 text-gray-900"
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                {label}
              </Link>
            ))}
            {isStaff ? (
              <Link
                href="/admin"
                className={cn(
                  "flex items-center gap-1.5 text-sm font-medium transition-colors",
                  pathname.startsWith("/admin")
                    ? "text-[#167E6C]"
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                <Shield className="size-4" />
                Admin
              </Link>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-gray-500 sm:inline">
            {session?.user?.name}
          </span>
          <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: "/" })}>
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
