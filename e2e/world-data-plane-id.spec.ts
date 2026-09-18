import { test, expect, type Page, type Route } from "@playwright/test";

const SESSION_BODY = {
  token: "e2e-platform-token",
  user: {
    uid: "usr_e2e_world_data",
    email: "world-data-e2e@example.com",
    displayName: "World Data E2E",
    state: "ACTIVE",
    createTime: "2026-01-01T00:00:00Z",
  },
};

const WORLD_ID = "friendly-world-id";
const WORLD_UID = "w_canonical_data_plane_world";
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
}

test("SPARQL uses the canonical data-plane world UID", async ({ page }) => {
  await signInAndMockSession(page);
  await page.addInitScript(
    ({ worldId, token }) => {
      localStorage.setItem(
        `wazoo_world_tokens_${worldId}`,
        JSON.stringify([{ name: "E2E token", token }]),
      );
    },
    { worldId: WORLD_ID, token: WORLD_TOKEN },
  );

  let managementLookupCount = 0;
  await page.route(`**/v1/worlds/${WORLD_ID}`, async (route: Route) => {
    managementLookupCount += 1;
    return route.fulfill({
      json: {
        world: {
          uid: "platform-world-row",
          worldId: WORLD_ID,
          worldUid: WORLD_UID,
          displayName: "Friendly World",
          region: "auto",
          state: "ACTIVE",
          restorable: false,
          backend: "worlds-api",
        },
      },
    });
  });

  let dataPlanePath = "";
  await page.route("**/worlds/*/sparql", async (route: Route) => {
    if (route.request().resourceType() === "document") {
      return route.continue();
    }
    dataPlanePath = new URL(route.request().url()).pathname;
    return route.fulfill({
      json: { ok: true, message: "Graph update executed successfully." },
    });
  });

  await page.goto(`/worlds/${WORLD_ID}/sparql`);
  await page.getByRole("button", { name: "Execute Query" }).click();

  await expect(page.getByText("Update Successful")).toBeVisible();
  expect(managementLookupCount).toBe(1);
  expect(dataPlanePath).toBe(`/worlds/${WORLD_UID}/sparql`);

  await page.getByRole("button", { name: "Execute Query" }).click();
  await expect(page.getByText("Update Successful")).toBeVisible();
  expect(managementLookupCount).toBe(1);
});
