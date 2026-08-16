"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { NavTabs } from "@/components/nav-tabs";
import { QuotaErrorBanner } from "@/components/quota-error-banner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {usage.total.map((m) => (
                    <div key={m.metric} className="flex justify-between py-2">
                      <span className="text-sm">{m.metric}</span>
                      <span className="text-sm font-mono">
                        {m.quantity.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            {quotaSummary && quotaSummary.limits.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Limits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y">
                    {quotaSummary.limits.map((limit) => (
                      <div
                        key={limit.metric}
                        className="flex justify-between py-2"
                      >
                        <span className="text-sm">{limit.metric}</span>
                        <span className="text-sm font-mono">
                          {limit.quantity.toLocaleString()} /{" "}
                          {limit.limitQuantity.toLocaleString()} (
                          {limit.usagePercent}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
