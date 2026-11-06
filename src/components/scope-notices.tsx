import { AlertCircle, ShieldAlert } from "lucide-react";
import {
  DEFAULT_PLATFORM_SCOPES,
  type ScopeValidationResult,
} from "@/lib/platform-scopes";

interface ScopeNoticesProps {
  value: string;
  validation: ScopeValidationResult;
}

export function ScopeNotices({ value, validation }: ScopeNoticesProps) {
  return (
    <>
      {/* Default scope indicator */}
      {value.trim() === "" ? (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Note:</span> Leaving
          this empty will automatically grant all default scopes:{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
            {DEFAULT_PLATFORM_SCOPES.join(" ")}
          </code>
        </p>
      ) : null}

      {/* Reserved Admin Scope Warning */}
      {validation.hasAdminToken ? (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-600 dark:text-amber-400">
          <ShieldAlert className="size-4 shrink-0 mt-0.5" />
          <div>
            <strong>Reserved Scope:</strong> The{" "}
            <code className="font-mono">admin</code> scope cannot be requested
            via user API tokens and must be manually seeded.
          </div>
        </div>
      ) : null}

      {/* Validation Error Banner */}
      {!validation.isValid &&
      !validation.hasAdminToken &&
      validation.errorMessage ? (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <div>{validation.errorMessage}</div>
        </div>
      ) : null}
    </>
  );
}
