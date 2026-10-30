"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { NavTabs } from "@/components/nav-tabs";
import { QuotaErrorBanner } from "@/components/quota-error-banner";
import { Loader2 } from "lucide-react";
import { getWorldTabs } from "@/lib/utils";
import {
  errMsg,
  isUnauthorizedError,
  quotaErrorInfo,
  quotaFromData,
  type QuotaError,
  type QuotaSummary,
} from "@/lib/quota-error";
import { getWorldUsage, type UsageEvent } from "@wazoo/client";
import { UsageCards } from "./usage-cards";

export default function WorldUsagePage({
  params,
}: {
  params: Promise<{ worldId: string }>;
}) {
  const { worldId } = use(params);
  const { client, logout } = useAuth();
  const [usage, setUsage] = useState<{
    total: Array<{ metric: string; quantity: number }>;
    events: UsageEvent[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorQuota, setErrorQuota] = useState<QuotaError | null>(null);
  const [quotaSummary, setQuotaSummary] = useState<QuotaSummary | null>(null);

  const tabs = getWorldTabs(worldId);

  useEffect(() => {
    if (!client) return;
    setLoading(true);
    setError(null);
    setErrorQuota(null);
    setQuotaSummary(null);
    getWorldUsage({ client, path: { worldId } }).then((r) => {
      if (r.error) {
        if (isUnauthorizedError(r.error)) {
          logout();
          return;
        }
        setError(errMsg(r.error));
        setErrorQuota(quotaErrorInfo(r.error));
      } else if (r.data?.usage) {
        setUsage(r.data.usage);
        setQuotaSummary(quotaFromData(r.data));
      }
      setLoading(false);
    });
  }, [client, worldId, logout]);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Usage"
          description="Review usage metrics for this world"
        />
        <NavTabs tabs={tabs} />
        {error && (
          <QuotaErrorBanner
            message={error}
            usagePercent={errorQuota?.usagePercent}
            usageLabel="Usage"
            hint={
              errorQuota
                ? "Reduce usage or raise the plan limit to continue."
                : undefined
            }
          />
        )}
        {!error && quotaSummary && quotaSummary.state !== "OK" && (
          <QuotaErrorBanner
            message={
              quotaSummary.state === "THROTTLED"
                ? "This world has exceeded one or more usage limits."
                : "This world is approaching one or more usage limits."
            }
            usagePercent={quotaSummary.usagePercent}
            usageLabel="Usage"
            hint="Reduce usage or raise the plan limit to continue."
          />
        )}
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {!loading && usage && (
          <UsageCards usage={usage} quotaSummary={quotaSummary} />
        )}
      </div>
    </AppShell>
  );
}
