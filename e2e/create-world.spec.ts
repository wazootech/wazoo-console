import { expect, test, type Page, type Route } from "@playwright/test";

const WORLD_ID = "w_00000000-0000-4000-8000-000000000001";
const DISPLAY_NAME = "My E2E World";

const SESSION_BODY = {
  token: "e2e-platform-token",
  user: {
    id: "00000000-0000-4000-8000-000000000021",
    email: "create-world-e2e@example.com",
    displayName: "Create World E2E",
    state: "ACTIVE",
    createTime: "2026-01-01T00:00:00Z",
  },
};

const WORLD = {
  id: WORLD_ID,
  name: `worlds/${WORLD_ID}`,
  displayName: DISPLAY_NAME,
  region: "auto",
  state: "ACTIVE",
  restorable: false,
  backend: "worlds-api",
};

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

test.describe("create world dialog", () => {
  test("creates a world with a server-minted id and refreshes the list", async ({
    page,
  }) => {
    await signInAndMockSession(page);

    let created = false;
    let createRequestBody: unknown = null;
    await page.route("**/v1/worlds", async (route: Route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({
          json: created ? { worlds: [WORLD] } : { worlds: [] },
        });
      }
      createRequestBody = route.request().postDataJSON();
      created = true;
      return route.fulfill({ status: 201, json: { world: WORLD } });
    });

    await page.goto("/worlds");
    await expect(page.getByText("No Worlds yet.")).toBeVisible();
    await page.getByRole("button", { name: "Create your first World" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Display name").fill(DISPLAY_NAME);
    await expect(dialog.getByRole("button", { name: "Create" })).toBeEnabled();
    await dialog.getByRole("button", { name: "Create" }).click();

    await expect(dialog).not.toBeVisible();
    await expect(page.getByText(DISPLAY_NAME)).toBeVisible();
    await expect(page.getByText(WORLD_ID, { exact: true })).toBeVisible();
    await expect(page.getByText("ACTIVE")).toBeVisible();
    await expect(
      page.getByRole("link").filter({ hasText: DISPLAY_NAME }),
    ).toHaveAttribute("href", `/worlds/${WORLD_ID}/`);
    expect(createRequestBody).toEqual({
      world: { displayName: DISPLAY_NAME },
    });
  });

  test("asks only for a display name", async ({ page }) => {
    await signInAndMockSession(page);
    await page.route("**/v1/worlds", (route) =>
      route.fulfill({ json: { worlds: [] } }),
    );

    await page.goto("/worlds");
    await page.getByRole("button", { name: "Create your first World" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByLabel("Display name")).toBeVisible();
    await expect(dialog.getByLabel("World ID")).toHaveCount(0);
    await expect(dialog.getByLabel("World slug")).toHaveCount(0);
    await expect(dialog.getByLabel("Region")).toHaveCount(0);
    await expect(dialog.getByRole("button", { name: "Create" })).toBeDisabled();
    await dialog.getByLabel("Display name").fill("New World");
    await expect(dialog.getByRole("button", { name: "Create" })).toBeEnabled();
  });

  for (const { status, code, message } of [
    {
      status: 409,
      code: "ALREADY_EXISTS",
      message: "The worlds-api id already exists for a world.",
    },
    {
      status: 502,
      code: "WORLD_PROVISIONING_FAILED",
      message: "Failed to provision the world.",
    },
  ]) {
    test(`keeps the dialog open and displays the ${status} response`, async ({
      page,
    }) => {
      await signInAndMockSession(page);
      await page.route("**/v1/worlds", (route) => {
        if (route.request().method() === "GET") {
          return route.fulfill({ json: { worlds: [] } });
        }
        return route.fulfill({ status, json: { error: { code, message } } });
      });

      await page.goto("/worlds");
      await page.getByRole("button", { name: "Create your first World" }).click();
      const dialog = page.getByRole("dialog");
      await dialog.getByLabel("Display name").fill(DISPLAY_NAME);
      await dialog.getByRole("button", { name: "Create" }).click();
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole("alert")).toContainText(message);
    });
  }

  test("logs out on a 401 from create", async ({ page }) => {
    await signInAndMockSession(page);
    await page.route("**/v1/worlds", (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({ json: { worlds: [] } });
      }
      return route.fulfill({
        status: 401,
        json: {
          status: 401,
          error: { code: "UNAUTHORIZED", message: "Unauthorized" },
        },
      });
    });

    await page.goto("/worlds");
    await page.getByRole("button", { name: "Create your first World" }).click();
    await page.getByLabel("Display name").fill(DISPLAY_NAME);
    await page
      .getByRole("button", { name: "Create", exact: true })
      .click();
    await page.waitForURL("**/sign-in**");
  });
});
