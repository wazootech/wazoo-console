import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import type { QuotaSummary } from "@/lib/quota-error";
import type { Billing } from "@wazoo/client";

interface BillingCardsProps {
  billing: Billing;
  quotaSummary: QuotaSummary | null;
  cancelled: boolean;
  onCancelClick: () => void;
}

export function BillingCards({
  billing,
  quotaSummary,
  cancelled,
  onCancelClick,
}: BillingCardsProps) {
  return (
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
          <Badge variant={billing.customerConfigured ? "default" : "secondary"}>
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
              variant={billing.subscriptionConfigured ? "default" : "secondary"}
            >
              {billing.subscriptionConfigured ? "Configured" : "Not configured"}
            </Badge>
            {billing.subscriptionConfigured && !cancelled ? (
              <div>
                <Button variant="destructive" size="sm" onClick={onCancelClick}>
                  <XCircle className="size-4" />
                  Cancel subscription
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Cancelling ends the subscription immediately. Your world and
                  its data stay intact; access to paid features ends at the next
                  billing cycle.
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
