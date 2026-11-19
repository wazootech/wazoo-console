"use client";

import { useEffect, useState } from "react";
import {
  createBillingPortalSession,
  createCheckoutSession,
  getUserPlan,
  type Client,
  type UserPlan,
} from "@wazoo/client";
import { useAuth } from "@/lib/auth";
import { useApiQuery } from "@/lib/use-api-query";
import { errMsg, isUnauthorizedError } from "@/lib/quota-error";
import { useGT } from "gt-next";

/** After paying, the plan changes when Stripe's webhook lands; poll for it. */
const POLL_EVERY_MS = 2000;
const POLL_FOR_MS = 40_000;

const loadPlan = (client: Client) => getUserPlan({ client });

export type CheckoutReturn = "success" | "cancelled" | null;

function readCheckoutReturn(): CheckoutReturn {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("checkout");
  return value === "success" || value === "cancelled" ? value : null;
}

export function usePlan() {
  const gt = useGT();
  const { client, logout } = useAuth();
  const { data: first, loading } = useApiQuery(loadPlan, {
    signOutOnUnauthorized: true,
  });
  // The newest result from polling after checkout; it replaces the first load.
  const [polled, setPolled] = useState<{
    plan: UserPlan | null;
    error: string | null;
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"checkout" | "portal" | null>(null);
  // Read the return from Stripe once, then drop it from the URL below so a
  // refresh does not repeat the message.
  const [checkoutReturn] = useState(readCheckoutReturn);
  const [confirming, setConfirming] = useState(checkoutReturn === "success");

  const plan = polled ? polled.plan : (first?.data ?? null);
  const loadError = first?.error ? errMsg(first.error) : null;
  const error = actionError ?? (polled ? polled.error : loadError);

  useEffect(() => {
    if (checkoutReturn) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [checkoutReturn]);

  // The payment is confirmed to us by Stripe's webhook, a moment after the user
  // returns. Keep checking until the plan flips to Pro.
  useEffect(() => {
    if (!confirming || !client) return;
    const startedAt = Date.now();
    const timer = setInterval(async () => {
      const r = await getUserPlan({ client });
      let next: UserPlan | null = null;
      if (r.error) {
        if (isUnauthorizedError(r.error)) logout();
        else
          setPolled((p) => ({ plan: p?.plan ?? null, error: errMsg(r.error) }));
      } else {
        next = r.data ?? null;
        setPolled({ plan: next, error: null });
      }
      if (next?.plan === "pro" || Date.now() - startedAt > POLL_FOR_MS) {
        clearInterval(timer);
        setConfirming(false);
      }
    }, POLL_EVERY_MS);
    return () => clearInterval(timer);
  }, [confirming, client, logout]);

  async function goTo(kind: "checkout" | "portal") {
    if (!client) return;
    setBusy(kind);
    setActionError(null);
    const r =
      kind === "checkout"
        ? await createCheckoutSession({ client })
        : await createBillingPortalSession({ client });
    if (r.error || !r.data?.url) {
      if (r.error && isUnauthorizedError(r.error)) {
        logout();
        return;
      }
      setActionError(
        r.error
          ? errMsg(r.error)
          : gt("Could not open the payment page. Please try again."),
      );
      setBusy(null);
      return;
    }
    // Leaves the console; the spinner stays until the browser navigates.
    window.location.assign(r.data.url);
  }

  return { plan, loading, error, busy, checkoutReturn, confirming, goTo };
}
