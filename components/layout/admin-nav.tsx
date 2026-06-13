"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { LayoutDashboard, LifeBuoy, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/admin", label: "Queue", icon: LayoutDashboard },
  { href: "/tickets", label: "My Tickets", icon: LifeBuoy },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="flex min-h-screen bg-[#fafbfc]">
      <aside className="hidden w-64 shrink-0 border-r border-gray-100 bg-white md:flex md:flex-col">
        <div className="border-b border-gray-100 p-6">
          <Link href="/admin" className="text-xl font-bold text-gray-900">
            ticketr
          </Link>
          <p className="mt-1 text-xs text-gray-500">Admin panel</p>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                (href === "/admin" &&
                  (pathname === "/admin" || pathname.startsWith("/admin/tickets"))) ||
                  pathname === href
                  ? "bg-[#167E6C]/10 text-[#167E6C]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-gray-100 p-4">
          <p className="truncate text-sm font-medium text-gray-900">
            {session?.user?.name}
          </p>
          <p className="truncate text-xs text-gray-500">{session?.user?.email}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full justify-start"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="size-4" />
            Logout
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-16 items-center justify-between border-b border-gray-100 bg-white px-4 md:hidden">
          <Link href="/admin" className="font-bold text-gray-900">
            ticketr admin
          </Link>
          <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
            Logout
          </Button>
        </div>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
