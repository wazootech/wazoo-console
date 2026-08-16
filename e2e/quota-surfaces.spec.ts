import { test, expect, type Page } from "@playwright/test";

// Hermetic regression tests for the QuotaErrorBanner on the usage and billing
// surfaces (issue #68). Every API call is mocked at the browser level, so
// these run against any environment without touching real backends.

const SESSION_BODY = {
  token: "e2e-platform-token",
  user: {
    uid: "usr_e2e_quota",
    email: "quota-e2e@example.com",
    displayName: "Quota E2E",
    state: "ACTIVE",
    createTime: "2026-01-01T00:00:00Z",
  },
};

test.describe("quota banner on usage and billing surfaces", () => {
  async function signInAndMockSession(page: Page) {
    const baseURL = test.info().project.use.baseURL;
    if (!baseURL) throw new Error("baseURL is required for this spec");
    await page.context().addCookies([
      {
        name: "wazoo_console_token",
        value: "e2e-platform-token",
        url: baseURL,
      },
    ]);
    await page.route("**/api/auth/session", (route) =>
      route.fulfill({ json: SESSION_BODY }),
    );
  }

  test("usage page shows the quota banner when usage fetch is throttled", async ({
    page,
  }) => {
    await signInAndMockSession(page);
    await page.route("**/v1/worlds/*/usage", (route) =>
      route.fulfill({
        status: 429,
        json: {
          error: {
            code: "RESOURCE_EXHAUSTED",
            message: "Limit exceeded for SPARQL_QUERIES",
          },
          quota: {
            state: "THROTTLED",
            reason: "SPARQL_QUERIES_EXCEEDED",
            usagePercent: 92,
          },
        },
      }),
    );

    await page.goto("/worlds/quota-world/usage");
    const alert = page.getByRole("alert").filter({ hasText: "Limit exceeded" });
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("Usage is at 92%.");
    await expect(alert).toContainText(
      "Reduce usage or raise the plan limit to continue.",
    );
  });

  test("billing page shows the quota banner when billing fetch hits a plan cap", async ({
    page,
  }) => {
    await signInAndMockSession(page);
    await page.route("**/v1/worlds/*/billing", (route) =>
      route.fulfill({
        status: 429,
        json: {
          error: {
            code: "PLAN_LIMIT_REACHED",
            message: "Plan limit reached for this world",
          },
          quota: {
            state: "THROTTLED",
            reason: "PLAN_CAP_REACHED",
            usagePercent: 100,
          },
        },
      }),
    );

    await page.goto("/worlds/quota-world/billing");
    const alert = page
      .getByRole("alert")
      .filter({ hasText: "Plan limit reached" });
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("Database capacity is at 100%.");
    await expect(alert).toContainText(
      "Upgrade your plan or free up capacity to continue.",
    );
  });
});
