import { test, expect } from "@playwright/test";

const API_BASE_URL = process.env.API_BASE_URL ?? "https://api.wazoo.dev";
const WORLDS_API_URL = process.env.WORLDS_API_URL ?? "https://worlds-api.wazoo.dev";

test.describe("prod smoke", () => {
  test("console landing page loads without console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("body")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("unauthenticated app route redirects to sign-in", async ({ request }) => {
    const response = await request.get("/worlds", { maxRedirects: 0 });
    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
  });

  test("API health endpoints return ok", async ({ request }) => {
    for (const url of [`${API_BASE_URL}/health`, `${WORLDS_API_URL}/health`]) {
      const response = await request.get(url);
      expect(response.status(), `Expected 200 from ${url}`).toBe(200);
      const body = await response.json();
      expect(body.status).toBe("ok");
    }
  });

  test("OpenAPI specs are reachable", async ({ request }) => {
    for (const url of [
      `${API_BASE_URL}/openapi.json`,
      `${WORLDS_API_URL}/openapi.json`,
    ]) {
      const response = await request.get(url);
      expect(response.status(), `Expected 200 from ${url}`).toBe(200);
      const body = await response.json();
      expect(body.openapi).toBeDefined();
      expect(body.paths).toBeDefined();
    }
  });

  test("unauthenticated API calls return 401", async ({ request }) => {
    const apiResponse = await request.get(`${API_BASE_URL}/v1/worlds`);
    expect(apiResponse.status()).toBe(401);

    const worldsResponse = await request.get(`${WORLDS_API_URL}/worlds`);
    expect(worldsResponse.status()).toBe(401);
  });
});
