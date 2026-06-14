"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";
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
import { apiClient } from "@/lib/api-client";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const registerResult = await apiClient.post("/api/auth/register", {
      fullName,
      email,
      password,
    });

    if (!registerResult.success) {
      setError(registerResult.error ?? "Registration failed");
      setLoading(false);
      return;
    }

    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (signInResult?.error) {
      setError("Account created but sign in failed. Try logging in.");
      return;
    }

    window.location.href = "/";
  };

  return (
    <div className="receipt-page flex min-h-screen items-center justify-center px-4 py-8">
      <ReceiptPaper className="w-full p-6 sm:p-8">
        <ReceiptMeta left="REGISTER" right="TICKETR" />
        <div className="my-4 flex justify-center">
          <BrandLogo href="/" height={100} />
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Start submitting support tickets
        </p>

        <ReceiptDivider />

        <div className="space-y-4">
          <OAuthButtons />
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="receipt-label">
                Full name
              </Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="receipt-label">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                minLength={6}
                required
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </ReceiptPaper>
    </div>
  );
}
