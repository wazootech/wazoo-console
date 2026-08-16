/**
 * Shared helpers for surfacing platform API errors consistently. The platform
 * API returns quota/limit errors (429) shaped as
 * `{ error: { code, message }, quota: { state, reason?, usagePercent? } }`;
 * every surface that can hit one renders a QuotaErrorBanner, and non-quota
 * errors degrade to the generic message.
 */

export interface QuotaError {
  usagePercent?: number;
}

export function errMsg(err: unknown): string {
  if (typeof err === "object" && err !== null && "error" in err)
    return (err as { error: { message: string } }).error.message;
  return "Unknown error";
}

export function isUnauthorizedError(err: unknown): boolean {
  if (typeof err === "object" && err !== null) {
    if ("status" in err && (err as { status: number }).status === 401)
      return true;
    if ("error" in err) {
      const msg = (err as { error: { message?: string; code?: string } }).error;
      if (
        msg?.code === "UNAUTHORIZED" ||
        msg?.message?.toLowerCase().includes("token is expired") ||
        msg?.message?.toLowerCase().includes("unauthorized")
      ) {
        return true;
      }
    }
  }
  return false;
}

/** Returns quota usage info when the error carries a quota payload, else null. */
export function quotaErrorInfo(err: unknown): QuotaError | null {
  if (typeof err === "object" && err !== null && "error" in err) {
    const body = err as { quota?: { usagePercent?: number } };
    if (body.quota) {
      return { usagePercent: body.quota.usagePercent };
    }
  }
  return null;
}
