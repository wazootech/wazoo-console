import { test, expect } from "@playwright/test";
import * as auth from "./helpers/authenticate";

// Live UI world-creation gate (issue #80 §2). Drives the create-world dialog
// through the real console against the QA backend, automating QA-checklist
// step 6 from CONTRIBUTING.md. This deliberately does NOT run the WorkOS
// hosted sign-in: Cloudflare Turnstile blocks headless browsers, so the
// session is established exactly like the login callback does (`mintPlatformToken`
// → `wazoo_console_token` cookie); everything downstream is genuine.

const needsAdminToken = !process.env.WAZOO_PLATFORM_ADMIN_TOKEN;
test.skip(
  needsAdminToken,
  "WAZOO_PLATFORM_ADMIN_TOKEN is required to run against the live QA environment",
);

test("creates a world through the console UI and sees it ACTIVE in the list", async ({
  page,
}) => {
  const session = await auth.mintE2eUserSession(auth.createRunEmail());
  await auth.activateConsoleSession(page, session);

  const worldId = auth.createRunWorldId();
  const displayName = `E2E ${worldId}`;

  try {
    await page.goto("/worlds");
    await expect(
      page.getByRole("button", { name: "Create World" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Create World" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByLabel("World ID").fill(worldId);
    await dialog.getByLabel("Display Name").fill(displayName);
    await expect(dialog.getByRole("button", { name: "Create" })).toBeEnabled();
    await dialog.getByRole("button", { name: "Create" }).click();

    await expect(dialog).not.toBeVisible();
    await expect(page.getByText(displayName)).toBeVisible();
    await expect(page.getByText(worldId, { exact: true })).toBeVisible();
    await expect(page.getByText("ACTIVE")).toBeVisible();
  } finally {
    await auth.deleteWorldViaApi(session, worldId);
  }
});
