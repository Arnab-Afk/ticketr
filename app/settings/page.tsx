"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ReceiptDivider,
  ReceiptMeta,
  ReceiptPaper,
} from "@/components/receipt/receipt-paper";
import { apiClient } from "@/lib/api-client";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setLoading(true);
    const response = await apiClient.patch("/api/users/me/password", {
      currentPassword,
      newPassword,
    });
    setLoading(false);

    if (!response.success) {
      setError(response.error ?? "Failed to update password");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSuccess("Password updated successfully.");
  };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <main className="flex min-h-[50vh] items-center justify-center">
        <div className="receipt-spinner size-12" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <ReceiptPaper className="p-6 sm:p-8">
        <ReceiptMeta left="ACCOUNT" right="SETTINGS" />
        <h1 className="mt-4 text-xl font-bold">Change password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Signed in as {session?.user?.email}
        </p>

        <ReceiptDivider />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password" className="receipt-label">
              Current password
            </Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password" className="receipt-label">
              New password
            </Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="receipt-label">
              Confirm new password
            </Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {success ? (
            <p className="text-sm font-medium text-green-700">{success}</p>
          ) : null}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Updating..." : "Update password"}
          </Button>
        </form>
      </ReceiptPaper>
    </main>
  );
}
