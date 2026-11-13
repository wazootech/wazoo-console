import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

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
  if (apiUrl.includes("api-qa.wazoo.dev")) {
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

/**
 * Reads the saved world tokens from localStorage, throwing on parse errors or invalid data.
 * @param key The key under which the tokens are stored in localStorage.
 * @returns An array of saved world tokens.
 */
function readWorldTokens(key: string): SavedWorldToken[] {
  const raw = localStorage.getItem(key);
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

export function getLocalWorldTokens(worldId: string): SavedWorldToken[] {
  if (typeof window === "undefined") return [];
  try {
    return readWorldTokens(`wazoo_world_tokens_${worldId}`);
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
    const key = `wazoo_world_tokens_${worldId}`;

    // Let read failures stop the save so it preserves the existing data.
    const current = readWorldTokens(key);

    if (!current.some((t) => t.token === token)) {
      current.push({ token, name });
      localStorage.setItem(key, JSON.stringify(current));
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
