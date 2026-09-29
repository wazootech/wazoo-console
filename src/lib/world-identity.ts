import type { Client } from "@wazoo/client";

export type WorldState = "ACTIVE" | "SUSPENDED" | "DELETED";

export interface WorldIdentity {
  id: string;
  displayName: string;
  region: string;
  state: WorldState;
  backend: string;
  createTime?: string;
  updateTime?: string;
}

export type WorldIdentityResult<T> =
  | { data: T; error?: undefined; status?: number }
  | { data?: undefined; error: unknown; status?: number };

const bearerSecurity = [{ scheme: "bearer", type: "http" }] as const;

export async function listWorldIdentities(
  client: Client,
): Promise<WorldIdentityResult<WorldIdentity[]>> {
  try {
    const result = await client.get<unknown, unknown>({
      url: "/v1/worlds",
      security: bearerSecurity,
    });
    const status = result.response?.status;
    if (result.error !== undefined) {
      return { error: errorWithStatus(result.error, status), status };
    }

    const worlds = readWorldList(result.data);
    if (!worlds) {
      return {
        error: invalidWorldResponse(
          "The Worlds API returned an invalid world list.",
        ),
        status,
      };
    }

    return { data: worlds, status };
  } catch (error) {
    return { error };
  }
}

export async function getWorldIdentity(
  client: Client,
  worldId: string,
): Promise<WorldIdentityResult<WorldIdentity>> {
  try {
    const result = await client.get<unknown, unknown>({
      url: `/v1/worlds/${encodeURIComponent(worldId)}`,
      security: bearerSecurity,
    });
    const status = result.response?.status;
    if (result.error !== undefined) {
      return { error: errorWithStatus(result.error, status), status };
    }

    const world = readWorldEnvelope(result.data);
    if (!world) {
      return {
        error: invalidWorldResponse(
          "The Worlds API response did not include a canonical world ID.",
        ),
        status,
      };
    }
    if (world.id !== worldId) {
      return {
        error: invalidWorldResponse(
          "The Worlds API returned a world ID that does not match the requested world ID.",
        ),
        status,
      };
    }

    return { data: world, status };
  } catch (error) {
    return { error };
  }
}

export async function createWorldByDisplayName(
  client: Client,
  displayName: string,
): Promise<WorldIdentityResult<WorldIdentity>> {
  const name = displayName.trim();
  if (!name) {
    return {
      error: invalidWorldResponse("A world display name is required."),
    };
  }

  try {
    const result = await client.post<unknown, unknown>({
      url: "/v1/worlds",
      security: bearerSecurity,
      headers: { "Content-Type": "application/json" },
      body: { world: { displayName: name } },
    });
    const status = result.response?.status;
    if (result.error !== undefined) {
      return { error: errorWithStatus(result.error, status), status };
    }

    const world = readWorldEnvelope(result.data);
    if (!world) {
      return {
        error: invalidWorldResponse(
          "The Worlds API response did not include the created world's canonical ID.",
        ),
        status,
      };
    }

    return { data: world, status };
  } catch (error) {
    return { error };
  }
}

export function worldIdentityErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (isRecord(error)) {
    const nested = error.error;
    if (isRecord(nested) && typeof nested.message === "string") {
      return nested.message;
    }
    if (typeof error.message === "string") return error.message;
  }
  return "Unknown error";
}

function readWorldList(value: unknown): WorldIdentity[] | null {
  if (!isRecord(value) || !Array.isArray(value.worlds)) return null;
  const worlds: WorldIdentity[] = [];
  for (const item of value.worlds) {
    const world = readWorld(item);
    if (!world) return null;
    worlds.push(world);
  }
  return worlds;
}

function readWorldEnvelope(value: unknown): WorldIdentity | null {
  if (!isRecord(value)) return null;
  return readWorld(value.world);
}

function readWorld(value: unknown): WorldIdentity | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    value.id.length === 0 ||
    typeof value.displayName !== "string" ||
    !isWorldState(value.state)
  ) {
    return null;
  }

  const world: WorldIdentity = {
    id: value.id,
    displayName: value.displayName,
    region: typeof value.region === "string" ? value.region : "—",
    state: value.state,
    backend: typeof value.backend === "string" ? value.backend : "—",
  };
  if (typeof value.createTime === "string") world.createTime = value.createTime;
  if (typeof value.updateTime === "string") world.updateTime = value.updateTime;
  return world;
}

function isWorldState(value: unknown): value is WorldState {
  return value === "ACTIVE" || value === "SUSPENDED" || value === "DELETED";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function errorWithStatus(error: unknown, status: number | undefined): unknown {
  if (status === undefined) return error;
  if (error instanceof Error) {
    return { status, error: { message: error.message } };
  }
  if (isRecord(error)) return { ...error, status };
  return { status, error: { message: worldIdentityErrorMessage(error) } };
}

function invalidWorldResponse(message: string) {
  return { error: { code: "INVALID_WORLD_RESPONSE", message } };
}
