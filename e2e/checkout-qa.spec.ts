import { test, expect } from "@playwright/test";
import * as auth from "./helpers/authenticate";

// Live-QA: a free user's "Upgrade to Pro" button reaches Stripe Checkout. It
// stops there, without paying, so it leaves only an unpaid test-mode session
// that Stripe expires. Skipped on environments where billing is not configured
// (no Stripe keys yet), so it is safe to run everywhere and starts verifying
// the moment the keys exist. Sign-in is minted like the other live specs.

const needsAdminToken = !process.env.WAZOO_PLATFORM_ADMIN_TOKEN;
test.skip(
  needsAdminToken,
  "WAZOO_PLATFORM_ADMIN_TOKEN is required to run against the live QA environment",
);

test("Upgrade to Pro sends a free user to Stripe Checkout", async ({
  page,
}) => {
  const session = await auth.mintE2eUserSession(auth.createRunEmail());
  const plan = await auth.getUserPlanViaApi(session);
  test.skip(
    !plan.billing?.checkoutAvailable,
    "Billing is not configured on this environment yet",
  );
  expect(plan.plan).toBe("free");

  await auth.activateConsoleSession(page, session);
  await page.goto("/settings");
  await expect(page.getByText("Free", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Upgrade to Pro" }).click();

  await page.waitForURL(/^https:\/\/checkout\.stripe\.com\//, {
    timeout: 30_000,
  });
  expect(new URL(page.url()).hostname).toBe("checkout.stripe.com");
});
