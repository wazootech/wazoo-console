import { getWorld, type Client } from "@wazoo/client";

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

  const result = await getWorld({ client, path: { worldId } });
  if (result.error) {
    throw new Error(readApiError(result.error));
  }

  const dataPlaneWorldId = result.data?.world?.worldUid;
  if (!dataPlaneWorldId) {
    throw new Error(PROVISIONING_ERROR);
  }

  return dataPlaneWorldId;
}

function readApiError(error: unknown): string {
  if (typeof error === "object" && error !== null && "error" in error) {
    const nested = (error as { error?: unknown }).error;
    if (
      typeof nested === "object" &&
      nested !== null &&
      "message" in nested &&
      typeof (nested as { message?: unknown }).message === "string"
    ) {
      return (nested as { message: string }).message;
    }
  }
  return "Could not load the World metadata. Refresh the page and try again.";
}
