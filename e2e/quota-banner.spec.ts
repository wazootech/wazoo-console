import { test, expect } from "@playwright/test";

// Hermetic regression test for the DATABASE_LIMIT_REACHED quota banner in the
// create-world dialog. Every API call the page makes (session + worlds) is
// mocked at the browser level, so this spec runs against any environment
// (local `next start` in CI, or a deployed console) without touching real
// backends or needing the org's database quota to actually be exhausted.
//
// The only server-side requirement is the `wazoo_console_token` cookie, which
// lets the auth middleware pass; the session endpoint itself is intercepted so
// no real platform token or user is needed.

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

// Mirrors the wazoo-api 429 passthrough: worlds-api's DatabaseLimitError body
// wrapped with a quota payload (see wazoo-api POST /v1/worlds).
const DATABASE_LIMIT_BODY = {
  error: {
    code: "DATABASE_LIMIT_REACHED",
    message:
      "The organization has reached its database limit (100). Delete unused worlds or raise the database limit before creating more.",
  },
  quota: {
    state: "THROTTLED",
    reason: "DATABASE_LIMIT_REACHED",
    usagePercent: 100,
  },
};

test.describe("quota banner (DATABASE_LIMIT_REACHED)", () => {
  test("create-world dialog shows the database limit message, usage, and hint", async ({
    page,
    context,
  }) => {
    const baseURL = test.info().project.use.baseURL;
    if (!baseURL) throw new Error("baseURL is required for this spec");

    await context.addCookies([
      {
        name: "wazoo_console_token",
        value: "e2e-platform-token",
        url: baseURL,
      },
    ]);

    await page.route("**/api/auth/session", (route) =>
      route.fulfill({ json: SESSION_BODY }),
    );
    await page.route("**/v1/worlds", (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({ json: { worlds: [] } });
      }
      return route.fulfill({ status: 429, json: DATABASE_LIMIT_BODY });
    });

    await page.goto("/worlds");
    await expect(page.getByText("No Worlds yet.")).toBeVisible();

    await page.getByRole("button", { name: "Create your first World" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // The dialog pre-fills a suggested world ID; set one explicitly so the
    // submitted value is deterministic.
    await dialog.getByLabel("World ID").fill("quota-limit-e2e");
    await dialog.getByRole("button", { name: "Create" }).click();

    // The dialog also renders a transient world-ID validation alert, so scope
    // to the quota banner itself.
    const alert = dialog
      .getByRole("alert")
      .filter({ hasText: "database limit" });
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(DATABASE_LIMIT_BODY.error.message);
    await expect(alert).toContainText("Database capacity is at 100%.");
    await expect(alert).toContainText(
      "Delete unused worlds or raise the database limit to create more.",
    );
  });
});
