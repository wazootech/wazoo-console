import { test, expect, type Page, type Route } from "@playwright/test";

// Hermetic regression tests for the create-world dialog (issue #80). Every API
// call the page makes (session + worlds) is mocked at the browser level, so
// this spec runs against any environment (local `next start` in CI, or a
// deployed console) without touching real backends or needing an authenticated
// session.
//
// The only server-side requirement is the `wazoo_console_token` cookie, which
// lets the auth middleware pass; the session endpoint itself is intercepted so
// no real platform token or user is needed.

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

const WORLD_ID = "my-e2e-world";
const DISPLAY_NAME = "My E2E World";

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

/** Asserts the dialog's transient world-ID feedback alert contains `text`. */
async function expectIdAlert(
  dialog: ReturnType<Page["getByRole"]>,
  text: string,
) {
  await expect(
    dialog.getByRole("alert").filter({ hasText: text }),
  ).toBeVisible();
}

test.describe("create world dialog", () => {
  test("creates a world: dialog closes and the list refreshes with the new row", async ({
    page,
  }) => {
    await signInAndMockSession(page);

    let created = false;
    let createRequestBody: unknown = null;
    await page.route("**/v1/worlds", async (route: Route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({
          json: created
            ? {
                worlds: [
                  {
                    uid: "w_e2e_created",
                    worldId: WORLD_ID,
                    displayName: DISPLAY_NAME,
                    state: "ACTIVE",
                  },
                ],
              }
            : { worlds: [] },
        });
      }
      createRequestBody = route.request().postDataJSON();
      created = true;
      return route.fulfill({
        status: 201,
        json: {
          world: {
            uid: "w_e2e_created",
            worldId: WORLD_ID,
            displayName: DISPLAY_NAME,
            state: "ACTIVE",
          },
        },
      });
    });

    await page.goto("/worlds");
    await expect(page.getByText("No Worlds yet.")).toBeVisible();

    await page.getByRole("button", { name: "Create your first World" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByLabel("World ID").fill(WORLD_ID);
    await dialog.getByLabel("Display Name").fill(DISPLAY_NAME);
    await expect(dialog.getByRole("button", { name: "Create" })).toBeEnabled();
    await dialog.getByRole("button", { name: "Create" }).click();

    await expect(dialog).not.toBeVisible();
    await expect(page.getByText(DISPLAY_NAME)).toBeVisible();
    await expect(page.getByText(WORLD_ID)).toBeVisible();
    await expect(page.getByText("ACTIVE")).toBeVisible();

    expect(createRequestBody).toEqual({
      worldId: WORLD_ID,
      world: { displayName: DISPLAY_NAME, region: "auto" },
    });
  });

  test("disables Create and shows validation errors for invalid World IDs", async ({
    page,
  }) => {
    await signInAndMockSession(page);
    await page.route("**/v1/worlds", (route) =>
      route.fulfill({
        json: { worlds: [] },
      }),
    );

    await page.goto("/worlds");
    await page.getByRole("button", { name: "Create your first World" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const idInput = dialog.getByLabel("World ID");

    const cases: Array<{ value: string; message: string }> = [
      { value: "", message: "World ID is required." },
      { value: "Hello", message: "Must start with a lowercase letter." },
      {
        value: "my_world",
        message: "Only lowercase letters, digits, and hyphens allowed.",
      },
      { value: "ab", message: "Must be at least 3 characters." },
      { value: "a".repeat(64), message: "Must be 63 characters or fewer." },
    ];

    for (const { value, message } of cases) {
      await idInput.fill(value);
      await expectIdAlert(dialog, message);
      await expect(idInput).toHaveAttribute("aria-invalid", "true");
      await expect(
        dialog.getByRole("button", { name: "Create" }),
      ).toBeDisabled();
    }

    // A valid ID resolves the feedback to "Available" and re-enables Create.
    await idInput.fill("valid-world");
    await expect(dialog.getByText("Available")).toBeVisible();
    await expect(idInput).toHaveAttribute("aria-invalid", "false");
    await expect(dialog.getByRole("button", { name: "Create" })).toBeEnabled();
  });

  test("shows 'Already taken.' and disables Create when the World ID exists", async ({
    page,
  }) => {
    await signInAndMockSession(page);
    await page.route("**/v1/worlds", (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({
          json: {
            worlds: [
              {
                uid: "w_e2e_existing",
                worldId: "already-taken",
                displayName: "Existing",
                state: "ACTIVE",
              },
            ],
          },
        });
      }
      return route.fulfill({ status: 500, json: {} });
    });

    await page.goto("/worlds");
    await page.getByRole("button", { name: "Create World" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const idInput = dialog.getByLabel("World ID");

    await idInput.fill("already-taken");
    await expectIdAlert(dialog, "Already taken.");
    await expect(idInput).toHaveAttribute("aria-invalid", "true");
    await expect(dialog.getByRole("button", { name: "Create" })).toBeDisabled();
  });

  for (const { status, code, message } of [
    {
      status: 400,
      code: "INVALID_ARGUMENT",
      message: "World ID is already in use.",
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
      await page.route("**/v1/worlds", (route) => {
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
      await expect(dialog).toBeVisible();

      await dialog.getByLabel("World ID").fill("some-world");
      await dialog.getByRole("button", { name: "Create" }).click();

      await expect(dialog).toBeVisible();
      await expectIdAlert(dialog, message);
    });
  }

  test("logs out (redirects to /sign-out) on a 401 from create", async ({
    page,
  }) => {
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
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByLabel("World ID").fill("expired-session");
    await dialog.getByRole("button", { name: "Create" }).click();

    await page.waitForURL("**/sign-in**");
  });
});
