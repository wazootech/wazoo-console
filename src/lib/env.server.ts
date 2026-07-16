import { env } from "$env/dynamic/private";
import { env as publicEnv } from "$env/dynamic/public";

export function apiBaseUrl(platformEnv?: App.Platform["env"]): string {
  return platformEnv?.PUBLIC_WAZOO_API_BASE_URL ?? publicEnv.PUBLIC_WAZOO_API_BASE_URL ?? "https://api.wazoo.dev";
}

export function adminToken(platformEnv?: App.Platform["env"]): string {
  const token = platformEnv?.WAZOO_PLATFORM_ADMIN_TOKEN ?? env.WAZOO_PLATFORM_ADMIN_TOKEN;
  if (!token) throw new Error("WAZOO_PLATFORM_ADMIN_TOKEN is not configured");
  return token;
}
