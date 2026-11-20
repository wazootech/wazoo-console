"use client";

import { useCallback, use } from "react";
import { useApiQuery } from "@/lib/use-api-query";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { NavTabs } from "@/components/nav-tabs";
import { QuotaErrorBanner } from "@/components/quota-error-banner";
import { Loader2 } from "lucide-react";
import { getWorldTabs, translateWorldTabLabel } from "@/lib/utils";
import { useGT } from "gt-next";
import { errMsg, quotaErrorInfo, quotaFromData } from "@/lib/quota-error";
import { getWorldUsage, type Client } from "@wazoo/client";
import { UsageCards } from "./usage-cards";

export default function WorldUsagePage({
  params,
}: {
  params: Promise<{ worldId: string }>;
}) {
  const gt = useGT();
  const { worldId } = use(params);
  const fetchUsage = useCallback(
    (c: Client) => getWorldUsage({ client: c, path: { worldId } }),
    [worldId],
  );
  const { data: result, loading } = useApiQuery(fetchUsage, {
    signOutOnUnauthorized: true,
  });
  const error = result?.error ? errMsg(result.error) : null;
  const errorQuota = result?.error ? quotaErrorInfo(result.error) : null;
  const usage = result?.error ? null : (result?.data?.usage ?? null);
  const quotaSummary =
    !result?.error && result?.data?.usage ? quotaFromData(result.data) : null;

  const tabs = getWorldTabs(worldId).map((t) => ({
    ...t,
    label: translateWorldTabLabel(gt, t.label),
  }));

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title={gt("Usage")}
          description={gt("Review usage metrics for this world")}
        />
        <NavTabs tabs={tabs} />
        {error && (
          <QuotaErrorBanner
            message={error}
            usagePercent={errorQuota?.usagePercent}
            usageLabel={gt("Usage")}
            hint={
              errorQuota
                ? gt("Reduce usage or raise the plan limit to continue.")
                : undefined
            }
          />
        )}
        {!error && quotaSummary && quotaSummary.state !== "OK" && (
          <QuotaErrorBanner
            message={
              quotaSummary.state === "THROTTLED"
                ? gt("This world has exceeded one or more usage limits.")
                : gt("This world is approaching one or more usage limits.")
            }
            usagePercent={quotaSummary.usagePercent}
            usageLabel="Usage"
            hint={gt("Reduce usage or raise the plan limit to continue.")}
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
