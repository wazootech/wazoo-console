"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { NavTabs } from "@/components/nav-tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { getWorldUsage, type UsageEvent } from "@wazoo/client";

export default function WorldUsagePage({ params }: { params: Promise<{ worldId: string }> }) {
  const { worldId } = use(params);
  const { client } = useAuth();
  const [usage, setUsage] = useState<{ total: Array<{ metric: string; quantity: number }>; events: UsageEvent[] } | null>(null);
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
    getWorldUsage({ client, path: { worldId } }).then((r) => {
      if (!r.error && r.data?.usage) {
        setUsage(r.data.usage);
      }
      setLoading(false);
    });
  }, [client, worldId]);

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Usage</h1>
        <NavTabs tabs={tabs} />
        {loading && <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>}
        {!loading && usage && (
          <div className="space-y-6">
            <Card><CardHeader><CardTitle className="text-sm">Metrics</CardTitle></CardHeader>
              <CardContent><div className="divide-y">
                {usage.total.map((m) => (<div key={m.metric} className="flex justify-between py-2"><span className="text-sm">{m.metric}</span><span className="text-sm font-mono">{m.quantity.toLocaleString()}</span></div>))}
              </div></CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
