"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createBillingPortalSession,
  createCheckoutSession,
  getUserPlan,
  type UserPlan,
} from "@wazoo/client";
import { Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { errMsg, isUnauthorizedError } from "@/lib/quota-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** A stored triple costs about 9 database rows (the table plus its 8 indexes). */
const ROWS_PER_TRIPLE = 9;
/** After paying, the plan changes when Stripe's webhook lands; poll for it. */
const POLL_EVERY_MS = 2000;
const POLL_FOR_MS = 40_000;

type CheckoutReturn = "success" | "cancelled" | null;

function readCheckoutReturn(): CheckoutReturn {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("checkout");
  return value === "success" || value === "cancelled" ? value : null;
}

export function PlanCard() {
  const { client, logout } = useAuth();
  const [plan, setPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"checkout" | "portal" | null>(null);
  const [checkoutReturn, setCheckoutReturn] = useState<CheckoutReturn>(null);
  const [confirming, setConfirming] = useState(false);
  const checkoutReturnRead = useRef(false);

  const load = useCallback(async (): Promise<UserPlan | null> => {
    if (!client) return null;
    const r = await getUserPlan({ client });
    if (r.error) {
      if (isUnauthorizedError(r.error)) {
        logout();
        return null;
      }
      setError(errMsg(r.error));
      return null;
    }
    setError(null);
    setPlan(r.data ?? null);
    return r.data ?? null;
  }, [client, logout]);

  // Read the return from Stripe once, then drop it from the URL so a refresh
  // does not repeat the message.
  useEffect(() => {
    if (checkoutReturnRead.current) return;
    checkoutReturnRead.current = true;
    const value = readCheckoutReturn();
    if (!value) return;
    setCheckoutReturn(value);
    setConfirming(value === "success");
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    load().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [client, load]);

  // The payment is confirmed to us by Stripe's webhook, a moment after the user
  // returns. Keep checking until the plan flips to Pro.
  useEffect(() => {
    if (!confirming || !client) return;
    const startedAt = Date.now();
    const timer = setInterval(async () => {
      const next = await load();
      if (next?.plan === "pro" || Date.now() - startedAt > POLL_FOR_MS) {
        clearInterval(timer);
        setConfirming(false);
      }
    }, POLL_EVERY_MS);
    return () => clearInterval(timer);
  }, [confirming, client, load]);

  async function goTo(kind: "checkout" | "portal") {
    if (!client) return;
    setBusy(kind);
    setError(null);
    const r =
      kind === "checkout"
        ? await createCheckoutSession({ client })
        : await createBillingPortalSession({ client });
    if (r.error || !r.data?.url) {
      if (r.error && isUnauthorizedError(r.error)) {
        logout();
        return;
      }
      setError(
        r.error
          ? errMsg(r.error)
          : "Could not open the payment page. Please try again.",
      );
      setBusy(null);
      return;
    }
    // Leaves the console; the spinner stays until the browser navigates.
    window.location.assign(r.data.url);
  }

  const limit = plan?.dailyRowWrites ?? null;
  const used = plan?.rowsWrittenToday ?? null;
  const percent =
    limit && used !== null
      ? Math.min(100, Math.floor((used / limit) * 100))
      : 0;
  const isPro = plan?.plan === "pro";

  return (
    <Card aria-labelledby="plan-card-title">
      <CardHeader>
        <CardTitle id="plan-card-title" className="text-sm">
          Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading your plan...
          </div>
        ) : (
          <>
            {checkoutReturn === "success" && (
              <p role="status" className="text-sm text-green-500">
                {isPro
                  ? "You're on Pro. Thank you!"
                  : confirming
                    ? "Payment received. Updating your plan..."
                    : "Payment received. Your plan can take a minute to update; refresh this page to check."}
              </p>
            )}
            {checkoutReturn === "cancelled" && !isPro && (
              <p role="status" className="text-sm text-muted-foreground">
                Checkout was cancelled. You have not been charged.
              </p>
            )}
            {error && (
              <p role="alert" className="text-sm text-red-500">
                {error}
              </p>
            )}

            {plan && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Current plan
                  </span>
                  <Badge variant={isPro ? "default" : "secondary"}>
                    {isPro ? "Pro" : "Free"}
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Daily write usage
                    </span>
                    <span>
                      {limit !== null && used !== null
                        ? `${used.toLocaleString()} of ${limit.toLocaleString()} rows`
                        : "Unavailable right now"}
                    </span>
                  </div>
                  {limit !== null && used !== null && (
                    <>
                      <div
                        role="progressbar"
                        aria-label="Daily write usage"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={percent}
                        className="h-2 w-full overflow-hidden rounded bg-zinc-800"
                      >
                        <div
                          className={`h-full ${percent >= 90 ? "bg-red-500" : "bg-primary"}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Each stored triple uses about {ROWS_PER_TRIPLE} rows, so
                        this plan holds about{" "}
                        {Math.floor(limit / ROWS_PER_TRIPLE).toLocaleString()}{" "}
                        new triples a day (more with inference on). Reading is
                        never limited. The count resets at 00:00 UTC.
                      </p>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {plan.billing.checkoutAvailable && (
                    <Button
                      onClick={() => goTo("checkout")}
                      disabled={busy !== null}
                    >
                      {busy === "checkout" ? (
                        <Loader2 className="size-4 animate-spin mr-1.5" />
                      ) : (
                        <Sparkles className="size-4 mr-1.5" />
                      )}
                      Upgrade to Pro
                    </Button>
                  )}
                  {plan.billing.portalAvailable && (
                    <Button
                      variant="outline"
                      onClick={() => goTo("portal")}
                      disabled={busy !== null}
                    >
                      {busy === "portal" && (
                        <Loader2 className="size-4 animate-spin mr-1.5" />
                      )}
                      Manage billing
                    </Button>
                  )}
                </div>
                {!plan.billing.checkoutAvailable &&
                  !plan.billing.portalAvailable &&
                  !isPro && (
                    <p className="text-xs text-muted-foreground">
                      Paid plans are not available yet. Free is included while
                      Wazoo is in private beta.
                    </p>
                  )}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
