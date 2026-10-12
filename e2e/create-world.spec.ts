import { test, expect, type Page, type Route } from "@playwright/test";

const SESSION_BODY = {
  token: "e2e-platform-token",
  user: {
    uid: "usr_e2e_create_world",
    email: "create-world-e2e@example.com",
    displayName: "Create World E2E",
    state: "ACTIVE",
    createTime: "2026-01-01T00:00:00Z",
  },
};

const WORLD = {
  id: "w_e2e_created",
  displayName: "My E2E World",
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
  test("creates by display name and uses the returned world.id in the list", async ({
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
    const displayName = dialog.getByLabel("Display name");
    await expect(dialog.getByLabel("World slug")).toHaveCount(0);
    await expect(displayName).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Create" })).toBeDisabled();
    await displayName.fill("   ");
    await expect(dialog.getByRole("button", { name: "Create" })).toBeDisabled();
    await displayName.fill(WORLD.displayName);
    await expect(dialog.getByRole("button", { name: "Create" })).toBeEnabled();
    await dialog.getByRole("button", { name: "Create" }).click();

    await expect(dialog.getByRole("status")).toHaveText(
      "World created successfully.",
    );
    await expect(dialog.getByText(WORLD.id, { exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: "Done" }).click();

    const worldLink = page.getByRole("link", { name: /My E2E World/ });
    await expect(worldLink).toHaveAttribute("href", `/worlds/${WORLD.id}/`);
    await expect(worldLink.getByText(WORLD.id, { exact: true })).toBeVisible();
    await expect(page.getByText("ACTIVE", { exact: true })).toBeVisible();
    expect(createRequestBody).toEqual({
      world: { displayName: WORLD.displayName },
    });
  });

  test("rejects create responses without the server-minted world.id", async ({
    page,
  }) => {
    await signInAndMockSession(page);
    await page.route("**/v1/worlds", (route: Route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({ json: { worlds: [] } });
      }
      return route.fulfill({
        status: 201,
        json: { world: { displayName: WORLD.displayName, worldId: WORLD.id } },
      });
    });

    await page.goto("/worlds");
    await page.getByRole("button", { name: "Create your first World" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Display name").fill(WORLD.displayName);
    await dialog.getByRole("button", { name: "Create" }).click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("alert")).toContainText(
      "The Worlds API response did not include the created world's canonical ID.",
    );
  });

  for (const { status, code, message } of [
    {
      status: 400,
      code: "INVALID_ARGUMENT",
      message: "The display name is invalid.",
    },
    {
      status: 502,
      code: "WORLD_PROVISIONING_FAILED",
      message: "Failed to provision the world.",
    },
  ]) {
    test(`keeps the dialog open and renders the ${status} server error`, async ({
      page,
    }) => {
      await signInAndMockSession(page);
      await page.route("**/v1/worlds", (route: Route) => {
        if (route.request().method() === "GET") {
          return route.fulfill({ json: { worlds: [] } });
        }
        return route.fulfill({ status, json: { error: { code, message } } });
      });

      await page.goto("/worlds");
      await page
        .getByRole("button", { name: "Create your first World" })
        .click();
      const dialog = page.getByRole("dialog");
      await dialog.getByLabel("Display name").fill(WORLD.displayName);
      await dialog.getByRole("button", { name: "Create" }).click();
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole("alert")).toContainText(message);
    });
  }

  test("logs out on a 401 from create", async ({ page }) => {
    await signInAndMockSession(page);
    await page.route("**/v1/worlds", (route: Route) => {
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
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Display name").fill(WORLD.displayName);
    await dialog.getByRole("button", { name: "Create" }).click();
    await page.waitForURL("**/sign-in**");
  });
});
