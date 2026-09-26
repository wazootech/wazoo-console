import { test, expect, type Page } from "@playwright/test";

// Regression coverage for the sign-in gate (no such coverage existed before
// 2026-09-25, which is how a dead "Continue to sign in" button reached
// production).
//
// The route answers `303` with a `Location` header pointing at WorkOS. The gate
// originally only understood a JSON `{ url }` response, so any browser that
// follows redirects natively fell through to the generic error and the button
// did nothing. These specs pin both accepted shapes and the failure path.
//
// No WorkOS credential is used. The redirect target is a public same-origin
// static asset, so the test never reaches WorkOS and can assert the final URL.

const PLACEHOLDER_TARGET = "/favicon.svg";

async function openGate(page: Page) {
  await page.goto("/sign-in/");
  await expect(
    page.getByRole("heading", { name: "Welcome to Wazoo" }),
  ).toBeVisible();
  return page.locator('input[type="checkbox"]');
}

async function confirmAgeAndContinue(page: Page) {
  const checkbox = await openGate(page);
  await checkbox.check();
  const button = page.getByRole("button", { name: "Continue to sign in" });
  await expect(button).toBeEnabled();
  await button.click();
}

test.describe("sign-in gate", () => {
  test("button stays disabled until the age confirmation is checked", async ({
    page,
  }) => {
    await openGate(page);
    const button = page.getByRole("button", { name: "Continue to sign in" });
    await expect(button).toBeDisabled();
    await page.locator('input[type="checkbox"]').check();
    await expect(button).toBeEnabled();
  });

  test("follows a redirect response to the sign-in target", async ({
    page,
  }) => {
    // Shape the route's actual response format: 303 + Location, no JSON body.
    // The static target keeps the test away from WorkOS.
    await page.route("**/api/auth/sign-in", (route) =>
      route.fulfill({
        status: 303,
        headers: { location: PLACEHOLDER_TARGET },
        body: "",
      }),
    );

    await confirmAgeAndContinue(page);

    await expect(page).toHaveURL(new RegExp(`${PLACEHOLDER_TARGET}$`));
    await expect(page.getByText("Could not start sign-in")).toHaveCount(0);
  });

  test("still supports a JSON url body", async ({ page }) => {
    await page.route("**/api/auth/sign-in", (route) =>
      route.fulfill({ json: { url: PLACEHOLDER_TARGET } }),
    );

    await confirmAgeAndContinue(page);

    await expect(page).toHaveURL(new RegExp(`${PLACEHOLDER_TARGET}$`));
  });

  test("surfaces the route's error message instead of dead-ending", async ({
    page,
  }) => {
    await page.route("**/api/auth/sign-in", (route) =>
      route.fulfill({
        status: 400,
        json: {
          error: {
            code: "AGE_GATE_REQUIRED",
            message: "You must confirm that you are at least 13 years old.",
          },
        },
      }),
    );

    await confirmAgeAndContinue(page);

    await expect(
      page.getByText("You must confirm that you are at least 13 years old."),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/sign-in\/$/);
  });

  test("reports a failed request rather than silently doing nothing", async ({
    page,
  }) => {
    await page.route("**/api/auth/sign-in", (route) => route.abort());

    await confirmAgeAndContinue(page);

    await expect(
      page.getByText("Could not start sign-in. Please try again."),
    ).toBeVisible();
  });
});
