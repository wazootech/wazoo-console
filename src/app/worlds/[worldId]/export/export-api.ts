import { isUnrecognizedWorldTokenError } from "@/lib/world-token-errors";
import { getWorldsApiUrl } from "@/lib/utils";
import type { ExportFormat } from "./export-formats";

/** Error envelope the Worlds API returns on a failed request. */
type ApiErrorBody = { error?: { message?: string; code?: string } };

/** Thrown when the API does not recognize the selected World token. */
export class InvalidWorldTokenError extends Error {}

/** Fetches the raw export text; throws on any non-OK response. */
export async function fetchExportText(
  worldId: string,
  token: string,
  format: ExportFormat,
): Promise<string> {
  const endpoint = `${getWorldsApiUrl()}/worlds/${encodeURIComponent(worldId)}/export?format=${encodeURIComponent(
    format.mime,
  )}`;

  const res = await fetch(endpoint, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const responseText = await res.text();
    let errData: ApiErrorBody | null = null;
    try {
      errData = responseText ? JSON.parse(responseText) : null;
    } catch {
      errData = null;
    }
    const message =
      errData?.error?.message ||
      responseText.trim() ||
      `Export failed with status ${res.status}`;
    if (
      isUnrecognizedWorldTokenError(res.status, message, errData?.error?.code)
    ) {
      throw new InvalidWorldTokenError(message);
    }
    throw new Error(message);
  }

  return res.text();
}
