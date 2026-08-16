import { test, expect, type Page } from "@playwright/test";

// Hermetic regression tests for the QuotaErrorBanner and quota summary on the
// usage and billing surfaces (issue #68 / wazoo-api#34). Every API call is
// mocked at the browser level, so these run against any environment without
// touching real backends.

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

const USAGE_200_BODY = {
  usage: {
    world: "worlds/quota-world",
    total: [{ metric: "SPARQL_QUERIES", quantity: 12000 }],
    events: [],
  },
  quota: {
    state: "THROTTLED",
    usagePercent: 120,
    limits: [
      {
        metric: "SPARQL_QUERIES",
        quantity: 12000,
        limitQuantity: 10000,
        usagePercent: 120,
      },
    ],
  },
};

const BILLING_200_BODY = {
  billing: {
    world: "worlds/quota-world",
    state: "ACTIVE",
    provider: "STRIPE",
    customerConfigured: true,
    subscriptionConfigured: true,
    paymentRequired: true,
  },
  quota: {
    state: "WARN",
    usagePercent: 92,
    limits: [
      {
        metric: "MAX_WORLDS",
        quantity: 9,
        limitQuantity: 10,
        usagePercent: 90,
      },
      {
        metric: "SPARQL_QUERIES",
        quantity: 9200,
        limitQuantity: 10000,
        usagePercent: 92,
      },
    ],
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

  test("usage page renders real limit data and the quota banner", async ({
    page,
  }) => {
    await signInAndMockSession(page);
    await page.route("**/v1/worlds/*/usage", (route) =>
      route.fulfill({ status: 200, json: USAGE_200_BODY }),
    );

    await page.goto("/worlds/quota-world/usage");
    const banner = page.getByRole("alert").filter({ hasText: "usage limits" });
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(
      "This world has exceeded one or more usage limits.",
    );
    await expect(banner).toContainText("Usage is at 120%.");
    await expect(banner).toContainText(
      "Reduce usage or raise the plan limit to continue.",
    );

    // The Limits card shows quantity / limit / percent.
    const limitsCard = page.getByText("Limits", { exact: true });
    await expect(limitsCard).toBeVisible();
    await expect(
      page.getByText("SPARQL_QUERIES", { exact: true }).last(),
    ).toBeVisible();
    await expect(page.getByText("12,000 / 10,000 (120%)")).toBeVisible();
  });

  test("billing page renders plan limits, payment-required state, and the quota banner", async ({
    page,
  }) => {
    await signInAndMockSession(page);
    await page.route("**/v1/worlds/*/billing", (route) =>
      route.fulfill({ status: 200, json: BILLING_200_BODY }),
    );

    await page.goto("/worlds/quota-world/billing");
    const banner = page.getByRole("alert").filter({ hasText: "plan limits" });
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(
      "This world is approaching its plan limits.",
    );
    await expect(banner).toContainText("Database capacity is at 92%.");
    await expect(banner).toContainText(
      "Upgrade your plan or free up capacity to continue.",
    );

    await expect(page.getByText("Payment required")).toBeVisible();
    await expect(page.getByText("Plan limits", { exact: true })).toBeVisible();
    await expect(page.getByText("9 / 10 (90%)")).toBeVisible();
    await expect(page.getByText("9,200 / 10,000 (92%)")).toBeVisible();
  });
});
