import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req: NextRequest & { auth: { user?: { role?: string } } | null }) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;
  const role = req.auth?.user?.role;

  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (role !== "admin" && role !== "agent") {
      return NextResponse.redirect(new URL("/tickets", req.url));
    }
  }

  if (pathname.startsWith("/tickets")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/tickets/:path*", "/admin/:path*"],
};
