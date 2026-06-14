"use client";

import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { BrandLogo } from "@/components/receipt/brand-logo";
import {
  ReceiptDivider,
  ReceiptMeta,
  ReceiptPaper,
} from "@/components/receipt/receipt-paper";

function dashboardPath(role?: string) {
  if (role === "admin" || role === "agent") return "/admin";
  return "/tickets";
}

export default function LoginPage() {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      window.location.href = dashboardPath(session.user.role);
    }
  }, [status, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    // Full navigation ensures the session cookie is sent on the next request.
    window.location.href = "/";
  };

  return (
    <div className="receipt-page flex min-h-screen items-center justify-center px-4 py-8">
      <ReceiptPaper className="w-full p-6 sm:p-8">
        <ReceiptMeta left="SIGN IN" right="TICKETR" />
        <div className="my-4 flex justify-center">
          <BrandLogo href="/" height={100} />
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Sign in to your account
        </p>

        <ReceiptDivider />

        <div className="space-y-4">
          <OAuthButtons />
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="receipt-label">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="receipt-label">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link href="/register" className="font-bold text-primary hover:underline">
              Register
            </Link>
          </p>
        </div>
      </ReceiptPaper>
    </div>
  );
}
