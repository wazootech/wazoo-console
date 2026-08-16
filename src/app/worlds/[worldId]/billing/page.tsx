"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { NavTabs } from "@/components/nav-tabs";
import { QuotaErrorBanner } from "@/components/quota-error-banner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, XCircle } from "lucide-react";
import { getWorldTabs } from "@/lib/utils";
import {
  errMsg,
  isUnauthorizedError,
  quotaErrorInfo,
  quotaFromData,
  type QuotaError,
  type QuotaSummary,
} from "@/lib/quota-error";
import { getWorldBilling, type Billing } from "@wazoo/client";

export default function WorldBillingPage({
  params,
}: {
  params: Promise<{ worldId: string }>;
}) {
  const { worldId } = use(params);
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

  const tabs = getWorldTabs(worldId);

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">State</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{billing.state}</Badge>
                  {billing.paymentRequired && (
                    <Badge variant="destructive">Payment required</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Provider</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{billing.provider}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Customer</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge
                  variant={billing.customerConfigured ? "default" : "secondary"}
                >
                  {billing.customerConfigured ? "Configured" : "Not configured"}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Subscription</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Badge
                    variant={
                      billing.subscriptionConfigured ? "default" : "secondary"
                    }
                  >
                    {billing.subscriptionConfigured
                      ? "Configured"
                      : "Not configured"}
                  </Badge>
                  {billing.subscriptionConfigured && !cancelled ? (
                    <div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setConfirm("");
                          setCancelError(null);
                          setCancelOpen(true);
                        }}
                      >
                        <XCircle className="size-4" />
                        Cancel subscription
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Cancelling ends the subscription immediately. Your world
                        and its data stay intact; access to paid features ends
                        at the next billing cycle.
                      </p>
                    </div>
                  ) : null}
                  {cancelled ? (
                    <p className="text-sm text-muted-foreground">
                      Subscription cancelled.
                    </p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
            {quotaSummary && quotaSummary.limits.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Plan limits</CardTitle>
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

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel subscription</DialogTitle>
            <DialogDescription>
              This ends your subscription. Your world and its data stay intact.
              Type <strong>{worldId}</strong> to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder={worldId}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={cancelling}
            />
            {cancelError && <QuotaErrorBanner message={cancelError} />}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setCancelOpen(false)}
                disabled={cancelling}
              >
                Keep subscription
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={confirm !== worldId || cancelling}
              >
                {cancelling ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Cancel subscription
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
