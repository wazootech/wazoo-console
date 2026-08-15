"use client";

import { Button } from "@/components/ui/button";
import { useConsent } from "@/lib/consent";

export function ConsentBanner() {
  const { status, accept, reject } = useConsent();

  // Strictly necessary auth/session cookies always work; only show the banner
  // until a choice is persisted. If consent was rejected, no non-essential
  // scripts load — see readConsent() in lib/consent.tsx.
  if (status !== null) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 p-4 backdrop-blur"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          We use cookies that are strictly necessary for authentication and
          session management. No analytics or tracking cookies are loaded
          without your consent.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" onClick={reject}>
            Reject all
          </Button>
          <Button onClick={accept}>Accept all</Button>
        </div>
      </div>
    </div>
  );
}
