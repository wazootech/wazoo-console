import { headers } from "next/headers";
import { resolvePreviewApiUrl } from "./preview-api";

export const PREVIEW_API_FALLBACK = "https://main.preview.api.wazoo.dev";

/**
 * Per-alias API URL for this request when running as a console preview
 * (WAZOO_PREVIEW=true from wrangler.preview.jsonc and a preview host), else
 * null so callers use NEXT_PUBLIC_API_URL exactly as before.
 */
export async function getPreviewApiUrl(): Promise<string | null> {
  if (process.env.WAZOO_PREVIEW !== "true") return null;
  const host = (await headers()).get("host");
  const fallback = process.env.NEXT_PUBLIC_API_URL ?? PREVIEW_API_FALLBACK;
  return resolvePreviewApiUrl(host, fallback);
}
