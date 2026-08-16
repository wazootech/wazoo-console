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
  type QuotaError,
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
  const [quota, setQuota] = useState<QuotaError | null>(null);

  const tabs = getWorldTabs(worldId);

  useEffect(() => {
    if (!client) return;
    setLoading(true);
    setError(null);
    setQuota(null);
    getWorldUsage({ client, path: { worldId } }).then((r) => {
      if (r.error) {
        if (isUnauthorizedError(r.error)) {
          logout();
          return;
        }
        setError(errMsg(r.error));
        setQuota(quotaErrorInfo(r.error));
      } else if (r.data?.usage) {
        setUsage(r.data.usage);
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
            usagePercent={quota?.usagePercent}
            usageLabel="Usage"
            hint={
              quota
                ? "Reduce usage or raise the plan limit to continue."
                : undefined
            }
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
          </div>
        )}
      </div>
    </AppShell>
  );
}
