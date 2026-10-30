"use client";

import { use } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { NavTabs } from "@/components/nav-tabs";
import { QuotaErrorBanner } from "@/components/quota-error-banner";
import { Loader2 } from "lucide-react";
import { getWorldTabs } from "@/lib/utils";
import { useWorldBilling } from "./use-world-billing";
import { BillingCards } from "./billing-cards";
import { BillingCancelDialog } from "./billing-cancel-dialog";

export default function WorldBillingPage({
  params,
}: {
  params: Promise<{ worldId: string }>;
}) {
  const { worldId } = use(params);
  const b = useWorldBilling(worldId);
  const { billing, loading, error, errorQuota, quotaSummary } = b;

  const tabs = getWorldTabs(worldId);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Billing"
          description="Review billing state for this world"
        />
        <NavTabs tabs={tabs} />
        {error && (
          <QuotaErrorBanner
            message={error}
            usagePercent={errorQuota?.usagePercent}
            hint={
              errorQuota
                ? "Upgrade your plan or free up capacity to continue."
                : undefined
            }
          />
        )}
        {!error && quotaSummary && quotaSummary.state !== "OK" && (
          <QuotaErrorBanner
            message={
              quotaSummary.state === "THROTTLED"
                ? "This world has exceeded its plan limits."
                : "This world is approaching its plan limits."
            }
            usagePercent={quotaSummary.usagePercent}
            hint="Upgrade your plan or free up capacity to continue."
          />
        )}
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {!loading && billing && (
          <BillingCards
            billing={billing}
            quotaSummary={quotaSummary}
            cancelled={b.cancelled}
            onCancelClick={() => {
              b.setConfirm("");
              b.setCancelError(null);
              b.setCancelOpen(true);
            }}
          />
        )}
      </div>

      <BillingCancelDialog
        worldId={worldId}
        open={b.cancelOpen}
        onOpenChange={b.setCancelOpen}
        confirm={b.confirm}
        setConfirm={b.setConfirm}
        cancelling={b.cancelling}
        cancelError={b.cancelError}
        onCancel={b.handleCancel}
      />
    </AppShell>
  );
}
