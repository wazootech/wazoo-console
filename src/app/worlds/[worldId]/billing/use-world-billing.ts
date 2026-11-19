"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useApiQuery } from "@/lib/use-api-query";
import type { BillingCancellationBody } from "@/lib/billing-cancellation";
import { errMsg, quotaErrorInfo, quotaFromData } from "@/lib/quota-error";
import { getWorldBilling, type Billing, type Client } from "@wazoo/client";

export function useWorldBilling(worldId: string) {
  const { client } = useAuth();
  const [cancelledBilling, setCancelledBilling] = useState<Billing | null>(
    null,
  );
  const [cancelOpen, setCancelOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);

  const fetchBilling = useCallback(
    (c: Client) => getWorldBilling({ client: c, path: { worldId } }),
    [worldId],
  );
  const { data: result, loading } = useApiQuery(fetchBilling, {
    signOutOnUnauthorized: true,
  });
  const error = result?.error ? errMsg(result.error) : null;
  const errorQuota = result?.error ? quotaErrorInfo(result.error) : null;
  const quotaSummary = result?.error ? null : quotaFromData(result?.data);
  const billing = cancelledBilling ?? result?.data?.billing ?? null;

  async function handleCancel() {
    if (!client || confirm !== worldId) return;
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch(
        `/api/worlds/${encodeURIComponent(worldId)}/billing/cancel`,
        { method: "POST" },
      );
      const body: BillingCancellationBody = await res.json().catch(() => {
        throw new Error(
          "Could not read the billing cancellation response as JSON",
        );
      });
      if (!res.ok || !body.billing) {
        setCancelError(
          body.error?.message ?? "Could not cancel the subscription.",
        );
        return;
      }
      setCancelledBilling(body.billing);
      setCancelled(true);
      setCancelOpen(false);
    } catch (err) {
      console.error("Could not cancel the world subscription", err);
      setCancelError("Could not cancel the subscription.");
    } finally {
      setCancelling(false);
    }
  }

  return {
    billing,
    loading,
    error,
    errorQuota,
    quotaSummary,
    cancelOpen,
    setCancelOpen,
    confirm,
    setConfirm,
    cancelling,
    cancelError,
    setCancelError,
    cancelled,
    handleCancel,
  };
}
