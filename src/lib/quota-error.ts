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

/**
 * Quota summary returned by the usage/billing GET endpoints (wazoo-api#34).
 * Not yet typed in the published @wazoo/client, so these mirror the OpenAPI
 * shapes until a release ships them.
 */
export interface QuotaLimitSummary {
  metric: string;
  quantity: number;
  limitQuantity: number;
  usagePercent: number;
}

export interface QuotaSummary {
  state: "OK" | "WARN" | "THROTTLED";
  usagePercent: number;
  limits: QuotaLimitSummary[];
}

/** Reads the quota summary off a successful getWorldUsage/getWorldBilling payload. */
export function quotaFromData(data: unknown): QuotaSummary | null {
  if (typeof data === "object" && data !== null && "quota" in data) {
    const quota = (data as { quota?: QuotaSummary }).quota;
    if (quota && typeof quota === "object") return quota;
  }
  return null;
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
