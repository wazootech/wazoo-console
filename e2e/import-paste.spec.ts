import { expect, test, type Page, type Route } from "@playwright/test";

// Regression for pasted imports (first-customer flow). Clicking "Execute
// Import" once, without "Preview", must send the pasted text. It used to post
// an empty `data` (and a stale content type) because the handler read state it
// had just set. Hermetic: the data plane is mocked and no credentials are needed.

const WORLD_ID = "w_00000000000000000000000002";
const WORLD_TOKEN = "wzw_e2e_import_token";

async function openImportPage(page: Page) {
  const baseURL = test.info().project.use.baseURL;
  if (!baseURL) throw new Error("baseURL is required for this spec");
  await page
    .context()
    .addCookies([
      {
        name: "wazoo_console_token",
        value: "e2e-platform-token",
        url: baseURL,
      },
    ]);
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({
      json: {
        token: "e2e-platform-token",
        user: {
          uid: "usr_e2e_import",
          email: "import-e2e@example.com",
          displayName: "Import E2E",
          state: "ACTIVE",
          createTime: "2026-01-01T00:00:00Z",
        },
      },
    }),
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
  await page.goto(`/worlds/${WORLD_ID}/import`);
  await page.getByRole("button", { name: "Paste text" }).click();
}

async function captureImport(page: Page) {
  const seen: { body?: { data: string; contentType: string }; auth?: string } =
    {};
  await page.route("**/worlds/*/import", async (route: Route) => {
    if (route.request().resourceType() === "document") {
      return route.continue();
    }
    seen.body = route.request().postDataJSON();
    seen.auth = route.request().headers().authorization;
    return route.fulfill({
      json: { ok: true, imported: { quads: 2, chunks: 0 } },
    });
  });
  return seen;
}

test("pasted JSON quads import on the first click, without Preview", async ({
  page,
}) => {
  await openImportPage(page);
  const seen = await captureImport(page);
  const pasted = JSON.stringify([
    {
      subject: "https://example.org/user/alice",
      predicate: "https://schema.org/givenName",
      object: "Alice",
    },
  ]);

  await page.locator("textarea").fill(pasted);
  await page.getByRole("button", { name: "Execute Import" }).click();

  await expect(page.getByText("Import Successful")).toBeVisible();
  expect(seen.body).toEqual({ data: pasted, contentType: "application/json" });
  expect(seen.auth).toBe(`Bearer ${WORLD_TOKEN}`);
});

test("pasted plain text is sent as text/plain on the first click", async ({
  page,
}) => {
  await openImportPage(page);
  const seen = await captureImport(page);

  await page.getByRole("button", { name: "Plain text" }).click();
  await page.locator("textarea").fill("first chunk\nsecond chunk");
  await page.getByRole("button", { name: "Execute Import" }).click();

  await expect(page.getByText("Import Successful")).toBeVisible();
  expect(seen.body).toEqual({
    data: "first chunk\nsecond chunk",
    contentType: "text/plain",
  });
});
