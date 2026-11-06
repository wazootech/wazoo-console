import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { QuotaSummary } from "@/lib/quota-error";
import type { UsageEvent } from "@wazoo/client";

interface UsageCardsProps {
  usage: {
    total: Array<{ metric: string; quantity: number }>;
    events: UsageEvent[];
  };
  quotaSummary: QuotaSummary | null;
}

export function UsageCards({ usage, quotaSummary }: UsageCardsProps) {
  return (
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
                <div key={limit.metric} className="flex justify-between py-2">
                  <span className="text-sm">{limit.metric}</span>
                  <span className="text-sm font-mono">
                    {limit.quantity.toLocaleString()} /{" "}
                    {limit.limitQuantity.toLocaleString()} ({limit.usagePercent}
                    %)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
