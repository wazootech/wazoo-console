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

const WORLD_ID = "w_00000000-0000-4000-8000-000000000001";
const WORLD_TOKEN = "wzw_e2e_world_token";

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
  await page.addInitScript(
    ({ worldId, token }) => {
      localStorage.setItem(
        `wazoo_world_tokens_${worldId}`,
        JSON.stringify([{ name: "E2E token", token }]),
      );
    },
    { worldId: WORLD_ID, token: WORLD_TOKEN },
  );
}

test("detail and reindex use the same server-minted world ID", async ({
  page,
}) => {
  await signInAndMockSession(page);

  let managementPath = "";
  await page.route(`**/v1/worlds/${WORLD_ID}`, async (route: Route) => {
    managementPath = new URL(route.request().url()).pathname;
    return route.fulfill({
      json: {
        world: {
          id: WORLD_ID,
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
  let reindexOrigin = "";
  let reindexAuthorization = "";
  await page.route("**/worlds/*/reindex", async (route: Route) => {
    reindexPath = new URL(route.request().url()).pathname;
    reindexOrigin = new URL(route.request().url()).origin;
    reindexAuthorization = route.request().headers().authorization ?? "";
    return route.fulfill({ json: { ok: true, status: "completed" } });
  });

  await page.goto(`/worlds/${WORLD_ID}`);
  await expect(
    page.getByRole("heading", { name: "Canonical World" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: `Copy world ID ${WORLD_ID}` }),
  ).toBeVisible();
  expect(managementPath).toBe(`/v1/worlds/${WORLD_ID}`);

  await page.getByRole("button", { name: "Reindex World" }).click();
  await expect(page.getByText("Reindexed")).toBeVisible();
  expect(reindexPath).toBe(`/worlds/${WORLD_ID}/reindex`);
  expect(reindexOrigin).toBe("https://data-qa.wazoo.dev");
  expect(reindexAuthorization).toBe(`Bearer ${WORLD_TOKEN}`);
});
