import {
  createPlatformToken as createPlatformTokenRequest,
  createWorld as createWorldRequest,
  createWorldToken as createWorldTokenRequest,
  deletePlatformToken as deletePlatformTokenRequest,
  deleteWorld as deleteWorldRequest,
  deleteWorldToken as deleteWorldTokenRequest,
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
  userId: string;
  email: string;
  displayName: string | null;
  state: "ACTIVE";
  createTime: string;
}

export interface AccountDeletion {
  deletionId: string;
  expiresAt: string;
}

export interface WorldResource {
  worldId: string;
  slug?: string;
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
  slug: string;
  world: {
    displayName: string;
    region?: string;
  };
}

export interface WorldUsageEvent {
  eventId: string;
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
  worldId: string;
  state: string;
  provider: string;
  customerConfigured: boolean;
  subscriptionConfigured: boolean;
  paymentRequired: boolean;
}

export interface PlatformToken {
  tokenId: string;
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
  tokenId: string;
  name: string;
  token: string;
}

export interface WorldToken {
  tokenId: string;
  name: string;
  namespace?: string;
  worldId?: string;
  scopes?: string[];
  createTime?: string;
}

export interface WorldTokenSecret {
  tokenId: string;
  name: string;
  token: string;
}

type ApiResult<T> = {
  data?: T;
  error?: unknown;
};

type PlatformTokenPathRequest = {
  client: Client;
  path: { tokenId: string };
};

type WorldTokenPathRequest = {
  client: Client;
  path: { worldId: string; tokenId: string };
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
  const invoke = deletePlatformTokenRequest as unknown as (
    request: PlatformTokenPathRequest,
  ) => Promise<ApiResult<unknown>>;
  return invoke({ client, path: { tokenId } });
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
  const invoke = deleteWorldTokenRequest as unknown as (
    request: WorldTokenPathRequest,
  ) => Promise<ApiResult<unknown>>;
  return invoke({ client, path: { worldId, tokenId } });
}
