import { expect, test, type Page, type Route } from "@playwright/test";

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

test("SPARQL sends the route worldId directly to the data plane", async ({
  page,
}) => {
  await signInAndMockSession(page);

  let managementLookupCount = 0;
  await page.route("**/v1/worlds/**", async (route: Route) => {
    managementLookupCount += 1;
    return route.continue();
  });

  let dataPlanePath = "";
  let dataPlaneAuthorization = "";
  await page.route("**/worlds/*/sparql", async (route: Route) => {
    if (route.request().resourceType() === "document") {
      return route.continue();
    }
    dataPlanePath = new URL(route.request().url()).pathname;
    dataPlaneAuthorization = route.request().headers().authorization ?? "";
    return route.fulfill({
      json: { ok: true, message: "Graph update executed successfully." },
    });
  });

  await page.goto(`/worlds/${WORLD_ID}/sparql`);
  await page.getByRole("button", { name: "Execute Query" }).click();

  await expect(page.getByText("Update Successful")).toBeVisible();
  expect(managementLookupCount).toBe(0);
  expect(dataPlanePath).toBe(`/worlds/${WORLD_ID}/sparql`);
  expect(dataPlaneAuthorization).toBe(`Bearer ${WORLD_TOKEN}`);
});
