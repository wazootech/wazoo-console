import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { wazooStorage } from "./wazoo-storage";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getWorldTabs(worldId: string) {
  return [
    { label: "Overview", href: `/worlds/${worldId}` },
    { label: "SPARQL", href: `/worlds/${worldId}/sparql` },
    { label: "Import", href: `/worlds/${worldId}/import` },
    { label: "Search", href: `/worlds/${worldId}/search` },
    { label: "Tokens", href: `/worlds/${worldId}/tokens` },
    { label: "Usage", href: `/worlds/${worldId}/usage` },
    { label: "Export", href: `/worlds/${worldId}/export` },
    { label: "Billing", href: `/worlds/${worldId}/billing` },
  ];
}

export function getWorldsApiUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.wazoo.dev";
  if (
    apiUrl.includes("api-qa.wazoo.dev") ||
    apiUrl.includes(".preview.api.wazoo.dev")
  ) {
    return "https://data-qa.wazoo.dev";
  }
  if (apiUrl.includes("api.wazoo.dev")) {
    return "https://data.wazoo.dev";
  }
  return "http://localhost:8787";
}

export interface SavedWorldToken {
  name: string;
  token: string;
}

/** The wazooStorage key under which a world's saved tokens are stored. */
export function worldTokensKey(worldId: string): string {
  return `world_tokens_${worldId}`;
}

/**
 * Parses a saved world token list, throwing on parse errors or invalid data.
 * @param raw The stored JSON, or null when nothing is saved.
 * @returns An array of saved world tokens.
 */
export function parseWorldTokens(raw: string | null): SavedWorldToken[] {
  if (raw === null) return [];
  let tokens: unknown;
  try {
    tokens = JSON.parse(raw);
  } catch {
    throw new SyntaxError("Saved world token list is not valid JSON");
  }
  if (
    Array.isArray(tokens) &&
    tokens.every((entry: unknown): entry is SavedWorldToken => {
      const value = entry as { name?: unknown; token?: unknown } | null;
      return (
        typeof value?.name === "string" && typeof value?.token === "string"
      );
    })
  ) {
    return tokens;
  }
  throw new TypeError("Invalid saved world token list");
}

/** Reads the saved world tokens stored under `key` (see wazoo-storage.ts). */
function readWorldTokens(key: string): SavedWorldToken[] {
  return parseWorldTokens(wazooStorage.get(key));
}

export function getLocalWorldTokens(worldId: string): SavedWorldToken[] {
  if (typeof window === "undefined") return [];
  try {
    return readWorldTokens(worldTokensKey(worldId));
  } catch (err) {
    console.error("Could not load saved world tokens", err);
    return [];
  }
}

export function saveLocalWorldToken(
  worldId: string,
  token: string,
  name: string,
): boolean {
  if (typeof window === "undefined") return false;
  try {
    const key = worldTokensKey(worldId);

    // Let read failures stop the save so it preserves the existing data.
    const current = readWorldTokens(key);

    if (!current.some((t) => t.token === token)) {
      current.push({ token, name });
      wazooStorage.set(key, JSON.stringify(current));
    }
    return true;
  } catch (err) {
    console.error("Could not save local world token", err);
    return false;
  }
}

export {
  translateExportFormatDescription,
  translatePresetQueryName,
  translateWorldTabLabel,
} from "./translate-labels";

/** The `message` of a thrown value, or "" when it carries none. */
export function thrownMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof err.message === "string"
  ) {
    return err.message;
  }
  return "";
}
