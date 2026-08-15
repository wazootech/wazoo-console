import type { User } from "@wazoo/client";

export const tokenCookieName = "wazoo_console_token";
export const ageCookieName = "wazoo_age_confirmed";

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "https://api.wazoo.dev";
}

export async function fetchUser(token: string): Promise<User | null> {
  const response = await fetch(`${getApiBaseUrl()}/v1/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) return null;

  const body = (await response.json()) as { user?: User };
  return body.user ?? null;
}

export async function mintPlatformToken(options: {
  email: string;
  displayName: string | null;
  ageConfirmed?: boolean;
}): Promise<string> {
  const adminToken = process.env.WAZOO_PLATFORM_ADMIN_TOKEN;
  if (!adminToken) {
    throw new Error("WAZOO_PLATFORM_ADMIN_TOKEN is required for WorkOS login.");
  }

  const response = await fetch(`${getApiBaseUrl()}/v1/auth/workos-session`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(options),
    cache: "no-store",
  });

  const body = (await response.json().catch(() => ({}))) as {
    token?: string;
    error?: { code?: string; message?: string };
  };

  if (!response.ok || !body.token) {
    const err = new Error(
      body.error?.message ?? "Could not create console session.",
    );
    (err as Error & { code?: string }).code = body.error?.code;
    throw err;
  }

  return body.token;
}

export function getDisplayName(options: {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}): string {
  return (
    [options.firstName, options.lastName].filter(Boolean).join(" ") ||
    options.email
  );
}
