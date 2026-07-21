"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { NavTabs } from "@/components/nav-tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { getWorldBilling, type Billing } from "@wazoo/client";

export default function WorldBillingPage({
  params,
}: {
  params: Promise<{ worldId: string }>;
}) {
  const { worldId } = use(params);
  const { client } = useAuth();
  const [billing, setBilling] = useState<Billing | null>(null);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { label: "Overview", href: `/worlds/${worldId}` },
    { label: "Tokens", href: `/worlds/${worldId}/tokens` },
    { label: "Usage", href: `/worlds/${worldId}/usage` },
    { label: "Billing", href: `/worlds/${worldId}/billing` },
  ];

  useEffect(() => {
    if (!client) return;
    setLoading(true);
    getWorldBilling({ client, path: { worldId } }).then((r) => {
      if (!r.error) setBilling(r.data?.billing ?? null);
      setLoading(false);
    });
  }, [client, worldId]);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Billing"
          description="Review billing state for this world"
        />
        <NavTabs tabs={tabs} />
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
                <Badge variant="secondary">{billing.state}</Badge>
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
                <Badge
                  variant={
                    billing.subscriptionConfigured ? "default" : "secondary"
                  }
                >
                  {billing.subscriptionConfigured
                    ? "Configured"
                    : "Not configured"}
                </Badge>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
