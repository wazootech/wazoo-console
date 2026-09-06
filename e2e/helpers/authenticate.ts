import type { Page } from "@playwright/test";

// Shared auth for live-QA e2e specs (issue #80 §2a). WorkOS-hosted sign-in
// cannot be automated (Cloudflare Turnstile blocks headless browsers,
// CONTRIBUTING.md), so we mint the exact session token a real sign-in
// produces and hand it to the browser as the `wazoo_console_token` cookie.
// Everything downstream of the sign-in page is genuine.

const QA_API_BASE =
  process.env.WAZOO_E2E_API_BASE_URL ?? "https://api-qa.wazoo.dev";

export interface E2eUserSession {
  email: string;
  token: string;
  expiresAt: string;
}

/** Admin token minted for the QA platform (scopes: admin). Required for live specs. */
export function requireAdminToken(): string {
  const token = process.env.WAZOO_PLATFORM_ADMIN_TOKEN;
  if (!token) {
    throw new Error(
      "WAZOO_PLATFORM_ADMIN_TOKEN is required for live-QA e2e specs",
    );
  }
  return token;
}

/** Per-run throwaway account so parallel/scheduled runs cannot collide. */
export function createRunEmail(): string {
  return `e2e+${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}@wazoo.dev`;
}

/** Unique world ID matching /^[a-z][a-z0-9-]{2,62}$/. */
export function createRunWorldId(): string {
  return `e2e-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Mints a real user-bound `wzp_…` session token via the same endpoint the
 * login callback trusts (`wazoo-api/src/routes/auth.ts:12`). The returned
 * token carries SESSION_DEFAULT_SCOPES bound to the throwaway user.
 */
export async function mintE2eUserSession(
  email: string,
): Promise<E2eUserSession> {
  const res = await fetch(`${QA_API_BASE}/v1/auth/workos-session`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requireAdminToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, displayName: "E2E", ageConfirmed: true }),
  });
  if (!res.ok) {
    throw new Error(
      `workos-session mint failed (${res.status}): ${await res.text()}`,
    );
  }
  const body = (await res.json()) as { token: string; expiresAt: string };
  return { email, token: body.token, expiresAt: body.expiresAt };
}

/** Hands the minted session to the browser as the console's auth cookie. */
export async function activateConsoleSession(
  page: Page,
  session: E2eUserSession,
): Promise<void> {
  const baseURL = page.context().options.baseURL ?? process.env.BASE_URL;
  if (!baseURL) throw new Error("baseURL is required to activate a session");
  await page
    .context()
    .addCookies([
      { name: "wazoo_console_token", value: session.token, url: baseURL },
    ]);
}

/** Tears down a world the test created, using the owner session token. */
export async function deleteWorldViaApi(
  session: E2eUserSession,
  worldId: string,
): Promise<void> {
  const res = await fetch(`${QA_API_BASE}/v1/worlds/${worldId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${session.token}` },
  });
  if (!res.ok && res.status !== 404) {
    console.warn(`world ${worldId} teardown returned ${res.status}`);
  }
}
