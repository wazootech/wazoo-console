import { test, expect } from "@playwright/test";
import {
  createPlaywrightClient,
  createWorldContext,
  runWorldLifecycleSuite,
} from "wazoo-e2e";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";
const WORLDS_API_URL = process.env.WORLDS_API_URL ?? "http://localhost:8081";
const ADMIN_TOKEN = process.env.WAZOO_PLATFORM_ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
  throw new Error(
    "WAZOO_PLATFORM_ADMIN_TOKEN is required. Generate one locally with " +
      "`npm run launch:seed-admin` in wazoo-api and export it before running this spec.",
  );
}

test.describe("world lifecycle", () => {
  test("create world, insert SPARQL data, and SELECT it back", async ({
    request,
  }) => {
    const client = createPlaywrightClient(request);
    const context = createWorldContext(client, {
      apiBaseUrl: API_BASE_URL,
      worldsApiUrl: WORLDS_API_URL,
      adminToken: ADMIN_TOKEN,
    });
    const results = await runWorldLifecycleSuite(context);
    for (const result of results) {
      expect(result.passed, `${result.name}: ${result.detail}`).toBe(true);
    }
  });
});
