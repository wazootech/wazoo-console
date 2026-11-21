/**
 * Per-PR API selection for console preview builds.
 *
 * A console preview at https://<alias>.preview.console.wazoo.dev calls the API
 * preview with the same alias (https://<alias>.preview.api.wazoo.dev) when it
 * exists, and otherwise the fallback (the API preview that tracks main).
 */

const PREVIEW_HOST =
  /^([a-z0-9](?:[a-z0-9-]*[a-z0-9])?)\.preview\.console\.wazoo\.dev$/;

const PROBE_TIMEOUT_MS = 1500;
const HIT_TTL_MS = 10 * 60_000;
const MISS_TTL_MS = 30_000;

type Fetch = (input: string, init?: RequestInit) => Promise<Response>;
type CacheEntry = { url: string; expires: number };

const cache = new Map<string, CacheEntry>();

/** Alias of a console preview host (port ignored), or null for any other host. */
export function previewAlias(host: string | null | undefined): string | null {
  const bare = (host ?? "").toLowerCase().replace(/:\d+$/, "");
  return PREVIEW_HOST.exec(bare)?.[1] ?? null;
}

/** The same-alias API preview URL for a console preview host, else null. */
export function previewApiCandidate(
  host: string | null | undefined,
): string | null {
  const alias = previewAlias(host);
  return alias ? `https://${alias}.preview.api.wazoo.dev` : null;
}

async function probe(candidate: string, fetchImpl: Fetch): Promise<boolean> {
  try {
    const response = await fetchImpl(`${candidate}/health`, {
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      redirect: "manual",
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function clearPreviewApiCache(): void {
  cache.clear();
}

/**
 * API base URL for a console preview host: the same-alias API preview when its
 * `/health` answers within the timeout, else `fallback`. Returns null when the
 * host is not a console preview host, so callers keep their normal behavior.
 * Answers are cached per alias in module memory (misses briefly, so a preview
 * API that deploys later is picked up).
 */
export async function resolvePreviewApiUrl(
  host: string | null | undefined,
  fallback: string,
  fetchImpl: Fetch = fetch,
  now: number = Date.now(),
): Promise<string | null> {
  const alias = previewAlias(host);
  const candidate = previewApiCandidate(host);
  if (!alias || !candidate) return null;
  if (candidate === fallback) return fallback;

  const cached = cache.get(alias);
  if (cached && cached.expires > now) return cached.url;

  const ok = await probe(candidate, fetchImpl);
  const url = ok ? candidate : fallback;
  cache.set(alias, { url, expires: now + (ok ? HIT_TTL_MS : MISS_TTL_MS) });
  return url;
}
