"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  errMsg,
  isUnauthorizedError,
  quotaErrorInfo,
  quotaFromData,
  type QuotaError,
  type QuotaSummary,
} from "@/lib/quota-error";
import { getWorldBilling, type Billing } from "@wazoo/client";

export function useWorldBilling(worldId: string) {
  const { client, logout } = useAuth();
  const [billing, setBilling] = useState<Billing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorQuota, setErrorQuota] = useState<QuotaError | null>(null);
  const [quotaSummary, setQuotaSummary] = useState<QuotaSummary | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    if (!client) return;
    setLoading(true);
    setError(null);
    setErrorQuota(null);
    setQuotaSummary(null);
    getWorldBilling({ client, path: { worldId } }).then((r) => {
      if (r.error) {
        if (isUnauthorizedError(r.error)) {
          logout();
          return;
        }
        setError(errMsg(r.error));
        setErrorQuota(quotaErrorInfo(r.error));
      } else {
        setBilling(r.data?.billing ?? null);
        setQuotaSummary(quotaFromData(r.data));
      }
      setLoading(false);
    });
  }, [client, worldId, logout]);

  async function handleCancel() {
    if (!client || confirm !== worldId) return;
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch(
        `/api/worlds/${encodeURIComponent(worldId)}/billing/cancel`,
        { method: "POST" },
      );
      const body = (await res.json().catch(() => ({}))) as {
        billing?: Billing;
        error?: { message?: string };
      };
      if (!res.ok || !body.billing) {
        setCancelError(
          body.error?.message ?? "Could not cancel the subscription.",
        );
        return;
      }
      setBilling(body.billing);
      setCancelled(true);
      setCancelOpen(false);
    } catch {
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
