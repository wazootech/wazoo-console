"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const privacyPolicyUrl = "https://docs.wazoo.dev/privacy-policy";
const termsUrl = "https://docs.wazoo.dev/terms";

export function SignInGate() {
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (!confirmed || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ageConfirmed: true }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: { message?: string };
      };
      if (!res.ok || !body.url) {
        setError(
          body.error?.message ?? "Could not start sign-in. Please try again.",
        );
        return;
      }
      window.location.assign(body.url);
    } catch {
      setError("Could not start sign-in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-screen items-center justify-center px-4 outline-none"
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Wazoo</CardTitle>
          <CardDescription>
            Wazoo is for people aged 13 and older. Under-13 accounts are not
            allowed without verifiable parental consent.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We collect the minimum needed to run your account: your email
            address and display name. Usage data is tracked to meter and manage
            the platform. See our{" "}
            <a
              href={privacyPolicyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4 hover:opacity-80"
            >
              privacy policy
            </a>{" "}
            and{" "}
            <a
              href={termsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4 hover:opacity-80"
            >
              terms of service
            </a>
            .
          </p>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 size-4 rounded border-input"
            />
            <span>
              I confirm I am at least 13 years old and have read the Wazoo{" "}
              <a
                href={privacyPolicyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-4 hover:opacity-80"
              >
                privacy policy
              </a>{" "}
              and{" "}
              <a
                href={termsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-4 hover:opacity-80"
              >
                terms of service
              </a>
              .
            </span>
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button
            className="w-full"
            disabled={!confirmed || submitting}
            onClick={handleContinue}
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Continue to sign in
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
