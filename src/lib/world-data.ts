import type { Client } from "@wazoo/client";
import {
  getWorldIdentity,
  worldIdentityErrorMessage,
} from "@/lib/world-identity";

const PROVISIONING_ERROR =
  "World provisioning is incomplete: the management API did not return a canonical data-plane ID. Refresh the page; if this persists, ask an administrator to repair or recreate the World.";

const dataPlaneIdCache = new Map<string, string>();
const dataPlaneIdInFlight = new Map<string, Promise<string>>();

export async function resolveWorldDataPlaneId(
  client: Client | null,
  worldId: string,
): Promise<string> {
  const cached = dataPlaneIdCache.get(worldId);
  if (cached) return cached;

  const inFlight = dataPlaneIdInFlight.get(worldId);
  if (inFlight) return inFlight;

  const pending = resolveWorldDataPlaneIdUncached(client, worldId);
  dataPlaneIdInFlight.set(worldId, pending);

  try {
    const dataPlaneWorldId = await pending;
    dataPlaneIdCache.set(worldId, dataPlaneWorldId);
    return dataPlaneWorldId;
  } finally {
    dataPlaneIdInFlight.delete(worldId);
  }
}

async function resolveWorldDataPlaneIdUncached(
  client: Client | null,
  worldId: string,
): Promise<string> {
  if (!client) {
    throw new Error(
      "Your session is not ready. Refresh the page and try again.",
    );
  }

  const result = await getWorldIdentity(client, worldId);
  if (result.error !== undefined) {
    throw new Error(worldIdentityErrorMessage(result.error));
  }

  const dataPlaneWorldId = result.data?.id;
  if (!dataPlaneWorldId) {
    throw new Error(PROVISIONING_ERROR);
  }

  return dataPlaneWorldId;
}
