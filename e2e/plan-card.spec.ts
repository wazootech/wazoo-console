import { expect, test, type Page, type Route } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// The plan card on /settings: shows the plan and daily write usage, starts a
// Pro checkout, opens the billing portal, and waits for the plan to flip to Pro
// after Stripe sends the user back. Hermetic: the platform API and Stripe are
// mocked, so no credentials or network are needed.

const STRIPE_CHECKOUT_URL = "https://checkout.stripe.com/c/pay/cs_test_e2e";
const STRIPE_PORTAL_URL = "https://billing.stripe.com/p/session/test_e2e";

type Plan = {
  plan: "free" | "pro";
  dailyRowWrites: number | null;
  rowsWrittenToday: number | null;
  usagePercent: number | null;
  day: string | null;
  billing: { checkoutAvailable: boolean; portalAvailable: boolean };
};

const FREE: Plan = {
  plan: "free",
  dailyRowWrites: 50_000,
  rowsWrittenToday: 12_500,
  usagePercent: 25,
  day: "2026-10-28",
  billing: { checkoutAvailable: true, portalAvailable: false },
};
const PRO: Plan = {
  plan: "pro",
  dailyRowWrites: 1_000_000,
  rowsWrittenToday: 12_500,
  usagePercent: 1,
  day: "2026-10-28",
  billing: { checkoutAvailable: false, portalAvailable: true },
};

async function signIn(page: Page) {
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
    route.fulfill({
      json: {
        token: "e2e-platform-token",
        user: {
          uid: "usr_e2e_plan",
          email: "plan-e2e@example.com",
          displayName: "Plan E2E",
          state: "ACTIVE",
          createTime: "2026-01-01T00:00:00Z",
        },
      },
    }),
  );
  await page.route("**/health", (route) =>
    route.fulfill({ json: { status: "ok" } }),
  );
}

/** Serves the given plans in order; the last one repeats. */
async function servePlans(page: Page, ...plans: Plan[]) {
  let calls = 0;
  await page.route("**/v1/users/me/plan", (route: Route) =>
    route.fulfill({ json: plans[Math.min(calls++, plans.length - 1)] }),
  );
  return () => calls;
}

async function stubStripePages(page: Page) {
  for (const url of [STRIPE_CHECKOUT_URL, STRIPE_PORTAL_URL]) {
    await page.route(url, (route) =>
      route.fulfill({ contentType: "text/html", body: "<h1>stripe</h1>" }),
    );
  }
}

test("a free user sees their usage and can start a Pro checkout", async ({
  page,
}) => {
  await signIn(page);
  await servePlans(page, FREE);
  await stubStripePages(page);
  let checkoutAuth = "";
  await page.route("**/v1/users/me/billing/checkout", (route) => {
    checkoutAuth = route.request().headers().authorization ?? "";
    return route.fulfill({ json: { url: STRIPE_CHECKOUT_URL } });
  });

  await page.goto("/settings");
  await expect(page.getByText("Free", { exact: true })).toBeVisible();
  await expect(page.getByText("12,500 of 50,000 rows")).toBeVisible();
  const bar = page.getByRole("progressbar", { name: "Daily write usage" });
  await expect(bar).toHaveAttribute("aria-valuenow", "25");
  await expect(page.getByText(/about 5,555 new triples a day/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Manage billing" }),
  ).toHaveCount(0);

  await page.getByRole("button", { name: "Upgrade to Pro" }).click();
  await page.waitForURL(STRIPE_CHECKOUT_URL);
  expect(checkoutAuth).toBe("Bearer e2e-platform-token");
});

test("after paying, the card waits for the plan to become Pro", async ({
  page,
}) => {
  await signIn(page);
  // Two reads still show Free (the webhook has not landed), then Pro.
  const calls = await servePlans(page, FREE, FREE, PRO);

  await page.goto("/settings?checkout=success");
  await expect(
    page.getByText("Payment received. Updating your plan..."),
  ).toBeVisible();
  await expect(page.getByText("You're on Pro. Thank you!")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText("Pro", { exact: true })).toBeVisible();
  await expect(page.getByText("12,500 of 1,000,000 rows")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Manage billing" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Upgrade to Pro" }),
  ).toHaveCount(0);
  expect(calls()).toBeGreaterThanOrEqual(3);
  // The message does not come back on refresh.
  expect(new URL(page.url()).search).toBe("");
});

test("a pro user can open the billing portal", async ({ page }) => {
  await signIn(page);
  await servePlans(page, PRO);
  await stubStripePages(page);
  await page.route("**/v1/users/me/billing/portal", (route) =>
    route.fulfill({ json: { url: STRIPE_PORTAL_URL } }),
  );

  await page.goto("/settings");
  await page.getByRole("button", { name: "Manage billing" }).click();
  await page.waitForURL(STRIPE_PORTAL_URL);
});

test("cancelling checkout says nothing was charged", async ({ page }) => {
  await signIn(page);
  await servePlans(page, FREE);

  await page.goto("/settings?checkout=cancelled");
  await expect(
    page.getByText("Checkout was cancelled. You have not been charged."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Upgrade to Pro" }),
  ).toBeVisible();
});

test("shows the server's message when checkout cannot start", async ({
  page,
}) => {
  await signIn(page);
  await servePlans(page, FREE);
  await page.route("**/v1/users/me/billing/checkout", (route) =>
    route.fulfill({
      status: 502,
      json: {
        error: {
          code: "STRIPE_ERROR",
          message: "Could not start checkout. Please try again.",
        },
      },
    }),
  );

  await page.goto("/settings");
  await page.getByRole("button", { name: "Upgrade to Pro" }).click();
  // Next.js has its own role="alert" route announcer, so match by the message.
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Could not start checkout. Please try again." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Upgrade to Pro" }),
  ).toBeEnabled();
});

test("when billing is off, there is no upgrade button and the beta is explained", async ({
  page,
}) => {
  await signIn(page);
  await servePlans(page, {
    ...FREE,
    billing: { checkoutAvailable: false, portalAvailable: false },
  });

  await page.goto("/settings");
  await expect(
    page.getByText("Paid plans are not available yet."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Upgrade to Pro" }),
  ).toHaveCount(0);
});

test("usage that the data plane cannot report is shown as unavailable", async ({
  page,
}) => {
  await signIn(page);
  await servePlans(page, {
    ...FREE,
    dailyRowWrites: null,
    rowsWrittenToday: null,
    usagePercent: null,
    day: null,
  });

  await page.goto("/settings");
  await expect(page.getByText("Unavailable right now")).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveCount(0);
});

test("the plan card has no serious or critical axe violations", async ({
  page,
}) => {
  await signIn(page);
  await servePlans(page, FREE);

  await page.goto("/settings");
  await expect(page.getByText("12,500 of 50,000 rows")).toBeVisible();
  const results = await new AxeBuilder({ page })
    .include('[aria-labelledby="plan-card-title"]')
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const violations = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(
    violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help })),
  ).toEqual([]);
});
