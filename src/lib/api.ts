const BASE_URL = "https://api.wazoo.dev";

interface ApiOptions {
  token: string;
}

async function request<T>(
  path: string,
  options: RequestInit & { token: string },
): Promise<{ data: T | null; error: { error: { code: string; message: string } } | null }> {
  const { token, ...init } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(init.headers as Record<string, string> | undefined),
  };

  try {
    const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
    const json = await res.json();
    if (!res.ok) {
      return { data: null, error: json as { error: { code: string; message: string } } };
    }
    return { data: json as T, error: null };
  } catch {
    return { data: null, error: { error: { code: "NETWORK", message: "Network error" } } };
  }
}

export interface User {
  uid: string;
  email: string;
  displayName?: string | null;
  state: string;
  createTime?: string;
}

export interface World {
  name: string;
  uid: string;
  worldId: string;
  displayName: string;
  region: string;
  state: string;
  restorable: boolean;
  backend: string;
  createTime?: string;
  updateTime?: string;
  deleteTime?: string;
  expireTime?: string;
}

export interface PlatformToken {
  uid: string;
  name: string;
  scope?: string;
  last_used_at?: string | null;
  expires_at?: string | null;
  createTime?: string;
}

export interface WorldToken {
  uid: string;
  name: string;
  namespace?: string;
  worldId?: string;
  scopes?: Array<string>;
  createTime?: string;
}

export interface UsageEvent {
  name?: string;
  metric?: string;
  quantity?: number;
  unit?: string;
  providerCostMicrocents?: number | null;
  wazooMarkupMicrocents?: number;
  estimatedCostMicrocents?: number | null;
  billingSource?: string;
  createTime?: string;
}

export interface Billing {
  world?: string;
  state?: string;
  provider?: string;
  customerConfigured?: boolean;
  subscriptionConfigured?: boolean;
  paymentRequired?: boolean;
}

export const api = {
  getHealth: () => fetch(`${BASE_URL}/health`).then((r) => r.json()),

  getUserMe: (opts: ApiOptions) =>
    request<{ user: User }>(`/v1/users/me?email=${encodeURIComponent(opts.token)}`, {
      method: "GET",
      ...opts,
    }),

  listWorlds: (opts: ApiOptions) =>
    request<{ worlds: World[] }>("/v1/worlds", { method: "GET", ...opts }),

  createWorld: (
    opts: ApiOptions,
    body: { worldId: string; world: { displayName: string; region?: string } },
  ) =>
    request<{ world: World }>("/v1/worlds", {
      method: "POST",
      body: JSON.stringify(body),
      ...opts,
    }),

  getWorld: (opts: ApiOptions, worldId: string) =>
    request<{ world: World }>(`/v1/worlds/${worldId}`, {
      method: "GET",
      ...opts,
    }),

  deleteWorld: (opts: ApiOptions, worldId: string) =>
    request<Record<string, never>>(`/v1/worlds/${worldId}`, {
      method: "DELETE",
      ...opts,
    }),

  listPlatformTokens: (opts: ApiOptions) =>
    request<{ tokens: PlatformToken[] }>("/v1/auth/api-tokens", {
      method: "GET",
      ...opts,
    }),

  createPlatformToken: (
    opts: ApiOptions,
    body: { name: string; scope?: string; email?: string },
  ) =>
    request<{ uid: string; name: string; token: string }>(
      "/v1/auth/api-tokens",
      { method: "POST", body: JSON.stringify(body), ...opts },
    ),

  deletePlatformToken: (opts: ApiOptions, tokenName: string) =>
    request<Record<string, never>>(`/v1/auth/api-tokens/${tokenName}`, {
      method: "DELETE",
      ...opts,
    }),

  listWorldTokens: (opts: ApiOptions, worldId: string) =>
    request<{ tokens: WorldToken[] }>(`/v1/worlds/${worldId}/auth/tokens`, {
      method: "GET",
      ...opts,
    }),

  createWorldToken: (opts: ApiOptions, worldId: string) =>
    request<{ token: WorldToken & { token?: string } }>(
      `/v1/worlds/${worldId}/auth/tokens`,
      { method: "POST", body: JSON.stringify({}), ...opts },
    ),

  deleteWorldToken: (opts: ApiOptions, worldId: string, tokenUid: string) =>
    request<Record<string, never>>(
      `/v1/worlds/${worldId}/auth/tokens/${tokenUid}`,
      { method: "DELETE", ...opts },
    ),

  getWorldUsage: (opts: ApiOptions, worldId: string) =>
    request<{ usage: { world: string; total: Array<{ metric: string; quantity: number }>; events: UsageEvent[] } }>(
      `/v1/worlds/${worldId}/usage`,
      { method: "GET", ...opts },
    ),

  getWorldBilling: (opts: ApiOptions, worldId: string) =>
    request<{ billing: Billing }>(`/v1/worlds/${worldId}/billing`, {
      method: "GET",
      ...opts,
    }),
};
