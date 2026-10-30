import type { Client } from "@wazoo/client";
import {
  errorWithStatus,
  invalidWorldResponse,
  readWorldEnvelope,
  readWorldList,
  type WorldIdentity,
  type WorldIdentityResult,
} from "./world-identity-parse";
export type {
  WorldIdentity,
  WorldIdentityResult,
  WorldState,
} from "./world-identity-parse";
export { worldIdentityErrorMessage } from "./world-identity-parse";

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
