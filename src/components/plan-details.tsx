import { Loader2, Sparkles } from "lucide-react";
import type { UserPlan } from "@wazoo/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/** A stored triple costs about 9 database rows (the table plus its 8 indexes). */
const ROWS_PER_TRIPLE = 9;

interface PlanDetailsProps {
  plan: UserPlan;
  error: string | null;
  busy: "checkout" | "portal" | null;
  goTo: (kind: "checkout" | "portal") => void;
}

export function PlanDetails({ plan, busy, goTo }: PlanDetailsProps) {
  const limit = plan.dailyRowWrites ?? null;
  const used = plan.rowsWrittenToday ?? null;
  const percent =
    limit && used !== null
      ? Math.min(100, Math.floor((used / limit) * 100))
      : 0;
  const isPro = plan.plan === "pro";

  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Current plan</span>
        <Badge variant={isPro ? "default" : "secondary"}>
          {isPro ? "Pro" : "Free"}
        </Badge>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Daily write usage</span>
          <span>
            {limit !== null && used !== null
              ? `${used.toLocaleString()} of ${limit.toLocaleString()} rows`
              : "Unavailable right now"}
          </span>
        </div>
        {limit !== null && used !== null && (
          <>
            <div
              role="progressbar"
              aria-label="Daily write usage"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              className="h-2 w-full overflow-hidden rounded bg-zinc-800"
            >
              <div
                className={`h-full ${percent >= 90 ? "bg-red-500" : "bg-primary"}`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Each stored triple uses about {ROWS_PER_TRIPLE} rows, so this plan
              holds about {Math.floor(limit / ROWS_PER_TRIPLE).toLocaleString()}{" "}
              new triples a day (more with inference on). Reading is never
              limited. The count resets at 00:00 UTC.
            </p>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {plan.billing.checkoutAvailable && (
          <Button onClick={() => goTo("checkout")} disabled={busy !== null}>
            {busy === "checkout" ? (
              <Loader2 className="size-4 animate-spin mr-1.5" />
            ) : (
              <Sparkles className="size-4 mr-1.5" />
            )}
            Upgrade to Pro
          </Button>
        )}
        {plan.billing.portalAvailable && (
          <Button
            variant="outline"
            onClick={() => goTo("portal")}
            disabled={busy !== null}
          >
            {busy === "portal" && (
              <Loader2 className="size-4 animate-spin mr-1.5" />
            )}
            Manage billing
          </Button>
        )}
      </div>
      {!plan.billing.checkoutAvailable &&
        !plan.billing.portalAvailable &&
        !isPro && (
          <p className="text-xs text-muted-foreground">
            Paid plans are not available yet. Free is included while Wazoo is in
            private beta.
          </p>
        )}
    </>
  );
}
