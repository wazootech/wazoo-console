import { expect, test, type Page, type Route } from "@playwright/test";

const SESSION_BODY = {
  token: "e2e-platform-token",
  user: {
    uid: "usr_e2e_world_identity",
    email: "world-identity-e2e@example.com",
    displayName: "World Identity E2E",
    state: "ACTIVE",
    createTime: "2026-01-01T00:00:00Z",
  },
};

const ROUTE_WORLD_ID = "world-route-id";
const CANONICAL_WORLD_ID = "w_server_minted_id";

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

test("detail and reindex use the server-returned world.id while keeping worldId routes", async ({
  page,
}) => {
  await signInAndMockSession(page);

  let managementPath = "";
  await page.route(`**/v1/worlds/${ROUTE_WORLD_ID}`, async (route: Route) => {
    managementPath = new URL(route.request().url()).pathname;
    return route.fulfill({
      json: {
        world: {
          id: CANONICAL_WORLD_ID,
          displayName: "Canonical World",
          region: "auto",
          state: "ACTIVE",
          restorable: false,
          backend: "worlds-api",
        },
      },
    });
  });

  let reindexPath = "";
  await page.route("**/worlds/*/reindex", async (route: Route) => {
    reindexPath = new URL(route.request().url()).pathname;
    return route.fulfill({ json: { ok: true } });
  });

  await page.goto(`/worlds/${ROUTE_WORLD_ID}`);
  await expect(
    page.getByRole("heading", { name: "Canonical World" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: `Copy world ID ${CANONICAL_WORLD_ID}`,
    }),
  ).toBeVisible();
  expect(managementPath).toBe(`/v1/worlds/${ROUTE_WORLD_ID}`);

  await page.getByRole("button", { name: "Reindex World" }).click();
  await expect(page.getByText("Reindexed")).toBeVisible();
  expect(reindexPath).toBe(`/worlds/${CANONICAL_WORLD_ID}/reindex`);
});
