import { expect, test, type Page, type Route } from "@playwright/test";

const SESSION_BODY = {
  token: "e2e-platform-token",
  user: {
    id: "00000000-0000-4000-8000-000000000019",
    email: "world-operations-e2e@example.com",
    displayName: "World Operations E2E",
    state: "ACTIVE",
    createTime: "2026-01-01T00:00:00Z",
  },
};

const WORLD_ID = "w_00000000-0000-4000-8000-000000000004";
const WORLD = {
  id: WORLD_ID,
  name: `worlds/${WORLD_ID}`,
  displayName: "Canonical World",
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

async function mockWorldMetadata(page: Page) {
  await page.route(`**/v1/worlds/${WORLD_ID}`, (route: Route) =>
    route.fulfill({ json: { world: WORLD } }),
  );
}

test("world detail, reindex, and deletion use worldId", async ({ page }) => {
  await signInAndMockSession(page);

  let worldDetailPath = "";
  let reindexPath = "";
  await page.route("**/worlds/*/reindex", async (route: Route) => {
    reindexPath = new URL(route.request().url()).pathname;
    await route.fulfill({ json: { ok: true } });
  });

  let deletedWorldPath = "";
  await page.route("**/v1/worlds", (route: Route) =>
    route.fulfill({ json: { worlds: [] } }),
  );
  await page.route(`**/v1/worlds/${WORLD_ID}`, async (route: Route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (request.method() === "DELETE") {
      deletedWorldPath = pathname;
      return route.fulfill({ json: { world: WORLD } });
    }
    worldDetailPath = pathname;
    return route.fulfill({ json: { world: WORLD } });
  });

  await page.goto(`/worlds/${WORLD_ID}`);
  await expect(
    page.getByRole("heading", { name: WORLD.displayName }),
  ).toBeVisible();
  expect(worldDetailPath).toBe(`/v1/worlds/${WORLD_ID}`);
  await page.getByRole("button", { name: "Reindex World" }).click();
  await expect(page.getByText("Reindexed")).toBeVisible();
  expect(reindexPath).toBe(`/worlds/${WORLD_ID}/reindex`);

  await page.getByRole("button", { name: "Delete", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder(WORLD_ID).fill(WORLD_ID);
  await dialog.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page).toHaveURL(/\/worlds\/?$/);
  expect(deletedWorldPath).toBe(`/v1/worlds/${WORLD_ID}`);
});

test("usage requests the management API with worldId", async ({ page }) => {
  await signInAndMockSession(page);
  let usagePath = "";
  await page.route(`**/v1/worlds/${WORLD_ID}/usage`, async (route: Route) => {
    usagePath = new URL(route.request().url()).pathname;
    await route.fulfill({
      json: {
        usage: {
          worldId: WORLD_ID,
          total: [{ metric: "queries", quantity: 17 }],
          events: [
            {
              id: "00000000-0000-4000-8000-000000000020",
              name: "query-request",
              metric: "queries",
              quantity: 1,
              unit: "request",
              billingSource: "e2e",
              createTime: "2026-01-01T00:00:00Z",
            },
          ],
        },
        quota: { state: "OK", usagePercent: 17, limits: [] },
      },
    });
  });

  await page.goto(`/worlds/${WORLD_ID}/usage`);
  await expect(page.getByText("queries", { exact: true })).toBeVisible();
  await expect(page.getByText("17", { exact: true })).toBeVisible();
  expect(usagePath).toBe(`/v1/worlds/${WORLD_ID}/usage`);
});

test("search resolves and sends the canonical worldId", async ({ page }) => {
  await signInAndMockSession(page);
  await page.addInitScript(
    ({ worldId }) => {
      localStorage.setItem(
        `wazoo_world_tokens_${worldId}`,
        JSON.stringify([{ name: "E2E token", token: "wzw_e2e_search" }]),
      );
    },
    { worldId: WORLD_ID },
  );
  await mockWorldMetadata(page);

  let dataPlanePath = "";
  await page.route("**/worlds/*/search", async (route: Route) => {
    if (route.request().resourceType() === "document") {
      return route.continue();
    }
    dataPlanePath = new URL(route.request().url()).pathname;
    return route.fulfill({ json: { results: [], mode: "keyword" } });
  });

  await page.goto(`/worlds/${WORLD_ID}/search`);
  await page.getByPlaceholder(/Find references/).fill("canonical world");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect.poll(() => dataPlanePath).toBe(`/worlds/${WORLD_ID}/search`);
});
