import { expect, test, type Page, type Route } from "@playwright/test";

const SESSION_BODY = {
  token: "e2e-platform-token",
  user: {
    id: "00000000-0000-4000-8000-000000000015",
    email: "token-lifecycle-e2e@example.com",
    displayName: "Token Lifecycle E2E",
    state: "ACTIVE",
    createTime: "2026-01-01T00:00:00Z",
  },
};

const WORLD_ID = "w_00000000-0000-4000-8000-000000000003";

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

test("platform token issue and revocation use tokenId", async ({ page }) => {
  await signInAndMockSession(page);

  const tokenId = "00000000-0000-4000-8000-000000000016";
  let issuedBody: Record<string, unknown> | null = null;
  let revokedPath = "";
  let exists = false;

  await page.route("**/v1/auth/api-tokens**", async (route: Route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (request.method() === "GET") {
      return route.fulfill({
        json: {
          tokens: exists
            ? [{ id: tokenId, name: "release-key", scope: "worlds:read" }]
            : [],
        },
      });
    }
    if (request.method() === "POST") {
      issuedBody = request.postDataJSON();
      exists = true;
      return route.fulfill({
        status: 201,
        json: { id: tokenId, name: "release-key", token: "wzp_e2e_issued" },
      });
    }
    if (request.method() === "DELETE") {
      revokedPath = pathname;
      exists = false;
      return route.fulfill({ status: 204, body: "" });
    }
    return route.fulfill({ status: 405 });
  });

  await page.goto("/tokens");
  await page.getByRole("button", { name: "Create Token" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name").fill("release-key");
  await dialog.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByText(tokenId, { exact: true })).toBeVisible();
  expect(issuedBody).toMatchObject({
    email: SESSION_BODY.user.email,
    name: "release-key",
  });

  await page.getByRole("button", { name: "Revoke token release-key" }).click();
  await expect(page.getByText("No API tokens yet.")).toBeVisible();
  expect(revokedPath).toBe(`/v1/auth/api-tokens/${tokenId}`);
});

test("world token issue and revocation use worldId and tokenId", async ({
  page,
}) => {
  await signInAndMockSession(page);

  const tokenId = "00000000-0000-4000-8000-000000000017";
  let revokedPath = "";
  let exists = true;
  await page.route(
    `**/v1/worlds/${WORLD_ID}/auth/tokens**`,
    async (route: Route) => {
      const request = route.request();
      const pathname = new URL(request.url()).pathname;
      if (request.method() === "GET") {
        return route.fulfill({
          json: {
            tokens: exists
              ? [{ id: tokenId, name: "reader", worldId: WORLD_ID }]
              : [],
          },
        });
      }
      if (request.method() === "POST") {
        exists = true;
        return route.fulfill({
          status: 201,
          json: {
            token: {
              id: tokenId,
              name: "reader",
              worldId: WORLD_ID,
              token: "wzw_e2e_issued",
            },
          },
        });
      }
      if (request.method() === "DELETE") {
        revokedPath = pathname;
        exists = false;
        return route.fulfill({ status: 204, body: "" });
      }
      return route.fulfill({ status: 405 });
    },
  );

  await page.goto(`/worlds/${WORLD_ID}/tokens`);
  await expect(page.getByText(tokenId, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Create Token" }).click();
  await page.getByRole("button", { name: "Show token" }).click();
  await expect(page.getByText("wzw_e2e_issued", { exact: true })).toBeVisible();
  await expect(page.getByText("wzw_e2e_issued")).toBeVisible();
  await page.getByRole("button", { name: "Revoke token reader" }).click();
  await expect(page.getByText("No world tokens yet.")).toBeVisible();
  expect(revokedPath).toBe(`/v1/worlds/${WORLD_ID}/auth/tokens/${tokenId}`);
});
