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

export function readWorldList(value: unknown): WorldIdentity[] | null {
  if (!isRecord(value) || !Array.isArray(value.worlds)) return null;
  const worlds: WorldIdentity[] = [];
  for (const item of value.worlds) {
    const world = readWorld(item);
    if (!world) return null;
    worlds.push(world);
  }
  return worlds;
}

export function readWorldEnvelope(value: unknown): WorldIdentity | null {
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

export function errorWithStatus(
  error: unknown,
  status: number | undefined,
): unknown {
  if (status === undefined) return error;
  if (error instanceof Error) {
    return { status, error: { message: error.message } };
  }
  if (isRecord(error)) return { ...error, status };
  return { status, error: { message: worldIdentityErrorMessage(error) } };
}

export function invalidWorldResponse(message: string) {
  return { error: { code: "INVALID_WORLD_RESPONSE", message } };
}
