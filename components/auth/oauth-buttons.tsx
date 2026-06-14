"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const hasGoogle = Boolean(
  process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true"
);
const hasGitHub = Boolean(
  process.env.NEXT_PUBLIC_GITHUB_OAUTH_ENABLED === "true"
);

export function OAuthButtons() {
  if (!hasGoogle && !hasGitHub) return null;

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        {hasGoogle ? (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => signIn("google", { callbackUrl: "/tickets" })}
          >
            Continue with Google
          </Button>
        ) : null}
        {hasGitHub ? (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => signIn("github", { callbackUrl: "/tickets" })}
          >
            Continue with GitHub
          </Button>
        ) : null}
      </div>
      <div className="relative">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
          or
        </span>
      </div>
    </div>
  );
}
