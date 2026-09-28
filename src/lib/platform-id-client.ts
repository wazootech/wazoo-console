import {
  createPlatformToken as createPlatformTokenRequest,
  createWorld as createWorldRequest,
  createWorldToken as createWorldTokenRequest,
  deleteWorld as deleteWorldRequest,
  getWorld as getWorldRequest,
  getWorldBilling as getWorldBillingRequest,
  getWorldUsage as getWorldUsageRequest,
  listPlatformTokens as listPlatformTokensRequest,
  listWorldTokens as listWorldTokensRequest,
  listWorlds as listWorldsRequest,
  type Client,
} from "@wazoo/client";

export type { Client };

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string | null;
  state: "ACTIVE";
  createTime: string;
}

export interface AccountDeletion {
  id: string;
  expiresAt: string;
}

export interface WorldResource {
  name: string;
  id: string;
  displayName: string;
  region: string;
  state: "ACTIVE" | "SUSPENDED" | "DELETED";
  restorable: boolean;
  backend: "worlds-api";
  createTime?: string;
  updateTime?: string;
  deleteTime?: string;
  expireTime?: string;
}

export interface WorldCreateInput {
  world: {
    displayName: string;
  };
}

export interface WorldUsageEvent {
  id: string;
  name: string;
  metric: string;
  quantity: number;
  unit: string;
  providerCostMicrocents?: number | null;
  wazooMarkupMicrocents?: number;
  estimatedCostMicrocents?: number | null;
  billingSource: string;
  createTime: string;
}

export interface WorldUsage {
  worldId: string;
  total: Array<{ metric: string; quantity: number }>;
  events: WorldUsageEvent[];
}

export interface WorldBilling {
  id: string;
  worldId: string;
  state: string;
  provider: string;
  customerConfigured: boolean;
  subscriptionConfigured: boolean;
  paymentRequired: boolean;
}

export interface PlatformToken {
  id: string;
  name: string;
  scope?: string;
  last_used_at?: string | null;
  expires_at?: string | null;
  createTime?: string;
}

export interface PlatformTokenCreateInput {
  email?: string;
  name: string;
  scope?: string;
}

export interface PlatformTokenSecret {
  id: string;
  name: string;
  token: string;
}

export interface WorldToken {
  id: string;
  name: string;
  namespace?: string;
  worldId?: string;
  scopes?: string[];
  createTime?: string;
}

export interface WorldTokenSecret {
  id: string;
  name: string;
  token: string;
}

type ApiResult<T> = {
  data?: T;
  error?: unknown;
};

export function listWorlds(client: Client) {
  return listWorldsRequest({ client }) as unknown as Promise<
    ApiResult<{ worlds?: WorldResource[] }>
  >;
}

export function createWorld(client: Client, body: WorldCreateInput) {
  return createWorldRequest({ client, body }) as unknown as Promise<
    ApiResult<{ world?: WorldResource }>
  >;
}

export function getWorld(client: Client, worldId: string) {
  return getWorldRequest({ client, path: { worldId } }) as unknown as Promise<
    ApiResult<{ world?: WorldResource }>
  >;
}

export function deleteWorld(client: Client, worldId: string) {
  return deleteWorldRequest({
    client,
    path: { worldId },
  }) as unknown as Promise<ApiResult<{ world?: WorldResource }>>;
}

export function getWorldUsage(client: Client, worldId: string) {
  return getWorldUsageRequest({
    client,
    path: { worldId },
  }) as unknown as Promise<ApiResult<{ usage?: WorldUsage; quota?: unknown }>>;
}

export function getWorldBilling(client: Client, worldId: string) {
  return getWorldBillingRequest({
    client,
    path: { worldId },
  }) as unknown as Promise<
    ApiResult<{ billing?: WorldBilling; quota?: unknown }>
  >;
}

export function fetchPlatformTokens(client: Client) {
  return listPlatformTokensRequest({ client }) as unknown as Promise<
    ApiResult<{ tokens?: PlatformToken[] }>
  >;
}

export function issuePlatformToken(
  client: Client,
  body: PlatformTokenCreateInput,
) {
  return createPlatformTokenRequest({ client, body }) as unknown as Promise<
    ApiResult<PlatformTokenSecret>
  >;
}

export function revokePlatformToken(client: Client, tokenId: string) {
  return client.delete({
    url: `/v1/auth/api-tokens/${encodeURIComponent(tokenId)}`,
    security: [{ scheme: "bearer", type: "http" }],
  });
}

export function fetchWorldTokens(client: Client, worldId: string) {
  return listWorldTokensRequest({
    client,
    path: { worldId },
  }) as unknown as Promise<ApiResult<{ tokens?: WorldToken[] }>>;
}

export function issueWorldToken(client: Client, worldId: string) {
  return createWorldTokenRequest({
    client,
    path: { worldId },
  }) as unknown as Promise<ApiResult<{ token?: WorldTokenSecret }>>;
}

export function revokeWorldToken(
  client: Client,
  worldId: string,
  tokenId: string,
) {
  return client.delete({
    url: `/v1/worlds/${encodeURIComponent(worldId)}/auth/tokens/${encodeURIComponent(tokenId)}`,
    security: [{ scheme: "bearer", type: "http" }],
  });
}
