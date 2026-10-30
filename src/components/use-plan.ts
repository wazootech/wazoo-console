"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createBillingPortalSession,
  createCheckoutSession,
  getUserPlan,
  type UserPlan,
} from "@wazoo/client";
import { useAuth } from "@/lib/auth";
import { errMsg, isUnauthorizedError } from "@/lib/quota-error";

/** After paying, the plan changes when Stripe's webhook lands; poll for it. */
const POLL_EVERY_MS = 2000;
const POLL_FOR_MS = 40_000;

export type CheckoutReturn = "success" | "cancelled" | null;

function readCheckoutReturn(): CheckoutReturn {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("checkout");
  return value === "success" || value === "cancelled" ? value : null;
}

export function usePlan() {
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

  return { plan, loading, error, busy, checkoutReturn, confirming, goTo };
}
