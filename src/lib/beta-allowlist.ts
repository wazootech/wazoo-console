import { getAccessToken } from "./sheets-auth";

interface AllowlistCache {
  emails: Set<string>;
  expiresAt: number;
}

let cache: AllowlistCache | null = null;
const TTL_MS = 60_000;

function getEnv(platformEnv?: Record<string, string | undefined>) {
  const key = platformEnv?.GOOGLE_SERVICE_ACCOUNT_KEY ?? "";
  const sheetId = platformEnv?.BETA_ALLOWLIST_SHEET_ID ?? "1LPzBKy8ZPSUgh4V44PeXYM1p2o7L4d_ceFE__CIPr6o";
  return { key, sheetId };
}

async function fetchAllowlist(
  serviceAccountKey: string,
  sheetId: string,
): Promise<Set<string>> {
  const token = await getAccessToken(serviceAccountKey);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/'Form Responses 1'!B2:E`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Google Sheets API error: ${res.status}`);
  }

  const { values = [] } = (await res.json()) as { values?: string[][] };
  const emails = new Set<string>();

  for (const row of values) {
    const email = row[0]?.trim().toLowerCase();
    const approved = row[3]?.trim().toUpperCase();
    if (email && approved === "TRUE") {
      emails.add(email);
    }
  }

  return emails;
}

export async function isAllowed(
  email: string,
  platformEnv?: Record<string, string | undefined>,
): Promise<boolean> {
  const { key, sheetId } = getEnv(platformEnv);

  if (!key) {
    return ["ethan.r.davidson@gmail.com"].includes(email.toLowerCase());
  }

  if (cache && cache.expiresAt > Date.now()) {
    return cache.emails.has(email.toLowerCase());
  }

  try {
    const emails = await fetchAllowlist(key, sheetId);
    cache = { emails, expiresAt: Date.now() + TTL_MS };
    return emails.has(email.toLowerCase());
  } catch {
    if (cache) return cache.emails.has(email.toLowerCase());
    return false;
  }
}

export function clearCache(): void {
  cache = null;
}
