import type { User } from "@wazoo/client";

export const tokenCookieName = "wazoo_console_token";

export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  const redirectUri =
    process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI ??
    process.env.WORKOS_REDIRECT_URI ??
    "";
  if (
    redirectUri.includes("console-qa.wazoo.dev") ||
    redirectUri.includes("-qa.")
  ) {
    return "https://api-qa.wazoo.dev";
  }
  return "https://api.wazoo.dev";
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

export async function mintConsoleToken(options: {
  email: string;
  displayName: string | null;
}): Promise<string> {
  const adminToken =
    process.env.WAZOO_CONSOLE_ADMIN_TOKEN ??
    process.env.WAZOO_PLATFORM_ADMIN_TOKEN;
  if (!adminToken) {
    throw new Error(
      "WAZOO_CONSOLE_ADMIN_TOKEN or WAZOO_PLATFORM_ADMIN_TOKEN is required for WorkOS login.",
    );
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
    error?: { message?: string };
  };

  if (!response.ok || !body.token) {
    throw new Error(body.error?.message ?? "Could not create console session.");
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
