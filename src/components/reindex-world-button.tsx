"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface ReindexWorldButtonProps {
  worldId?: string | null;
  token?: string | null;
}

export function ReindexWorldButton({
  worldId,
  token,
}: ReindexWorldButtonProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleReindex() {
    setLoading(true);
    setStatus("idle");
    setErrorMsg(null);

    if (!worldId) {
      setErrorMsg(
        "World provisioning is incomplete: no canonical data-plane ID is available.",
      );
      setStatus("error");
      setLoading(false);
      return;
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_WORLDS_API_URL ?? "https://data.wazoo.dev";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(
        `${baseUrl}/worlds/${encodeURIComponent(worldId)}/reindex`,
        {
          method: "POST",
          headers,
        },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body?.error?.message ?? `Reindex failed (${res.status})`;
        setErrorMsg(msg);
        setStatus("error");
      } else {
        setStatus("success");
        setTimeout(() => setStatus("idle"), 4000);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Network error");
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleReindex}
        disabled={loading || !worldId}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <RefreshCw className="size-4" />
        )}
        Reindex World
      </Button>
      {!worldId && (
        <span className="text-xs text-amber-500">
          World provisioning is incomplete; refresh or contact an administrator.
        </span>
      )}
      {status === "success" && (
        <span className="text-xs text-emerald-400 flex items-center gap-1">
          <CheckCircle className="size-3.5" /> Reindexed
        </span>
      )}
      {status === "error" && errorMsg && (
        <span className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="size-3.5" /> {errorMsg}
        </span>
      )}
    </div>
  );
}
