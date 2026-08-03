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
    return "https://worlds-api-qa.wazoo.dev";
  }
  if (apiUrl.includes("api.wazoo.dev")) {
    return "https://worlds-api.wazoo.dev";
  }
  return "http://localhost:8787";
}

export interface SavedWorldToken {
  name: string;
  token: string;
}

export function getLocalWorldTokens(worldId: string): SavedWorldToken[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`wazoo_world_tokens_${worldId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalWorldToken(
  worldId: string,
  token: string,
  name: string,
) {
  if (typeof window === "undefined") return;
  try {
    const current = getLocalWorldTokens(worldId);
    // Avoid duplicates
    if (!current.some((t) => t.token === token)) {
      current.push({ token, name });
      localStorage.setItem(
        `wazoo_world_tokens_${worldId}`,
        JSON.stringify(current),
      );
    }
  } catch (e) {
    console.error("Failed to save local world token", e);
  }
}
