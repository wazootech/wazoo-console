"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { NavTabs } from "@/components/nav-tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { api, type UsageEvent } from "@/lib/api";

export default function WorldUsagePage({
  params,
}: {
  params: Promise<{ worldId: string }>;
}) {
  const { worldId } = use(params);
  const { token } = useAuth();
  const [usage, setUsage] = useState<{
    total: Array<{ metric: string; quantity: number }>;
    events: UsageEvent[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { label: "Overview", href: `/worlds/${worldId}` },
    { label: "Tokens", href: `/worlds/${worldId}/tokens` },
    { label: "Usage", href: `/worlds/${worldId}/usage` },
    { label: "Billing", href: `/worlds/${worldId}/billing` },
  ];

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api.getWorldUsage({ token }, worldId).then((r) => {
      if (!r.error && r.data?.usage) {
        const u = r.data.usage as unknown as {
          total: Array<{ metric: string; quantity: number }>;
          events: UsageEvent[];
        };
        setUsage(u);
      }
      setLoading(false);
    });
  }, [token, worldId]);

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Usage</h1>
        <NavTabs tabs={tabs} />

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && usage === null && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No usage data available.
            </CardContent>
          </Card>
        )}

        {usage && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {usage.total.map((metric) => (
                    <div
                      key={metric.metric}
                      className="flex justify-between py-2"
                    >
                      <span className="text-sm">{metric.metric}</span>
                      <span className="text-sm font-mono">
                        {metric.quantity.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {usage.total.length === 0 && (
                    <p className="text-sm text-muted-foreground py-2">
                      No metrics recorded.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {usage.events.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Recent Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {usage.events.slice(0, 20).map((event, i) => (
                      <div
                        key={i}
                        className="flex justify-between text-sm py-1"
                      >
                        <div>
                          <span>{event.metric}</span>
                          <span className="text-muted-foreground ml-2">
                            {event.unit}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono">
                            {event.quantity?.toLocaleString()}
                          </span>
                          {event.createTime && (
                            <div className="text-xs text-muted-foreground">
                              {new Date(event.createTime).toLocaleString()}
                            </div>
                          )}
                        </div>
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
