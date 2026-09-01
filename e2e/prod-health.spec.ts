import { test, expect } from "@playwright/test";

// Console-owned prod smoke: browser behavior that only the console repository
// can exercise. Cross-service health (wazoo-api, worlds-api) and platform
// lifecycle assertions live in wazoo-api's platform smoke suite
// (`npm run smoke:qa`), which owns the deployed platform contract.
test.describe("prod smoke", () => {
  test("console landing page loads without console errors", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      if (
        msg
          .text()
          .includes(
            "'upgrade-insecure-requests' is ignored when delivered in a report-only policy",
          )
      )
        return;
      errors.push(msg.text());
    });

    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("body")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("unauthenticated app route redirects to sign-in", async ({
    request,
  }) => {
    const response = await request.get("/worlds", { maxRedirects: 0 });
    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
  });

  test("console health proxy returns ok", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("ok");
  });
});