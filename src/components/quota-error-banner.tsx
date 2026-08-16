/**
 * QuotaErrorBanner renders a destructive alert for platform quota/limit
 * errors (e.g. 429 DATABASE_LIMIT_REACHED). The message comes from the API;
 * usagePercent and hint are optional and give the user the current usage
 * against the limit and a concrete remedy.
 */
export function QuotaErrorBanner({
  message,
  usagePercent,
  hint,
  usageLabel = "Database capacity",
}: {
  message: string;
  usagePercent?: number;
  hint?: string;
  usageLabel?: string;
}) {
  return (
    <div role="alert" className="text-sm text-destructive space-y-1">
      <p>{message}</p>
      {(usagePercent !== undefined || hint) && (
        <p>
          {usagePercent !== undefined
            ? `${usageLabel} is at ${Math.round(usagePercent)}%. `
            : null}
          {hint}
        </p>
      )}
    </div>
  );
}
