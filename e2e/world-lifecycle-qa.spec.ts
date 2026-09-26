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

  const slug = auth.createRunWorldSlug();
  const displayName = `E2E ${slug}`;
  let createdWorldId: string | null = null;

  try {
    await page.goto("/worlds");
    await expect(
      page.getByRole("button", { name: "Create World" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Create World" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByLabel("World slug").fill(slug);
    await dialog.getByLabel("Display Name").fill(displayName);
    await expect(dialog.getByRole("button", { name: "Create" })).toBeEnabled();
    const createResponsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return (
        url.pathname === "/v1/worlds" && response.request().method() === "POST"
      );
    });
    await dialog.getByRole("button", { name: "Create" }).click();

    const createResponse = await createResponsePromise;
    const createBody = await createResponse.json();
    expect(createResponse.status(), JSON.stringify(createBody)).toBe(201);
    const createdWorld = (
      createBody as {
        world: { worldId: string; slug: string };
      }
    ).world;
    createdWorldId = createdWorld.worldId;
    expect(createdWorld.slug).toBe(slug);

    await expect(dialog).not.toBeVisible();
    await expect(page.getByText(displayName)).toBeVisible();
    await expect(page.getByText(createdWorldId, { exact: true })).toBeVisible();
    await expect(page.getByText("ACTIVE")).toBeVisible();
  } finally {
    if (createdWorldId) await auth.deleteWorldViaApi(session, createdWorldId);
  }
});
