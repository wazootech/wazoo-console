"use client";

import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePlan } from "./use-plan";
import { PlanDetails } from "./plan-details";
import { useGT } from "gt-next";

export function PlanCard() {
  const gt = useGT();
  const { plan, loading, error, busy, checkoutReturn, confirming, goTo } =
    usePlan();

  const isPro = plan?.plan === "pro";

  return (
    <Card aria-labelledby="plan-card-title">
      <CardHeader>
        <CardTitle id="plan-card-title" className="text-sm">
          {gt("Plan")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />{" "}
            {gt("Loading your plan...")}
          </div>
        ) : (
          <>
            {checkoutReturn === "success" && (
              <p role="status" className="text-sm text-green-500">
                {isPro
                  ? gt("You're on Pro. Thank you!")
                  : confirming
                    ? gt("Payment received. Updating your plan...")
                    : gt(
                        "Payment received. Your plan can take a minute to update; refresh this page to check.",
                      )}
              </p>
            )}
            {checkoutReturn === "cancelled" && !isPro && (
              <p role="status" className="text-sm text-muted-foreground">
                {gt("Checkout was cancelled. You have not been charged.")}
              </p>
            )}
            {error && (
              <p role="alert" className="text-sm text-red-500">
                {error}
              </p>
            )}

            {plan && (
              <PlanDetails plan={plan} error={error} busy={busy} goTo={goTo} />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
