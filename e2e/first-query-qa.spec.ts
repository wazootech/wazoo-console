import { test, expect } from "@playwright/test";
import * as auth from "./helpers/authenticate";

// Live-QA first-customer flow, automating CONTRIBUTING.md QA checklist step 6:
// create a world, import data, run a SPARQL query, see the results render.
// Sign-in itself is not driven (Cloudflare Turnstile blocks headless browsers);
// the session is minted exactly like the login callback does and everything
// after it is genuine. It also checks that the plan and write budget the
// platform applies are visible, and counted, after the import.

const needsAdminToken = !process.env.WAZOO_PLATFORM_ADMIN_TOKEN;
test.skip(
  needsAdminToken,
  "WAZOO_PLATFORM_ADMIN_TOKEN is required to run against the live QA environment",
);

// The quickstart's four quads (docs.wazoo.dev/getting-started).
const QUADS = [
  {
    subject: "https://example.org/user/alice",
    predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    object: "https://schema.org/Person",
  },
  {
    subject: "https://example.org/user/alice",
    predicate: "https://schema.org/givenName",
    object: "Alice",
  },
  {
    subject: "https://example.org/user/bob",
    predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    object: "https://schema.org/Person",
  },
  {
    subject: "https://example.org/user/bob",
    predicate: "https://schema.org/givenName",
    object: "Bob",
  },
];

test("a new user creates a world, imports data and queries it", async ({
  page,
}) => {
  const session = await auth.mintE2eUserSession(auth.createRunEmail());
  await auth.activateConsoleSession(page, session);

  let worldId: string | null = null;
  try {
    // 1. Create a world through the dialog.
    await page.goto("/worlds");
    await page.getByRole("button", { name: "Create World" }).click();
    const dialog = page.getByRole("dialog");
    await dialog
      .getByLabel("Display name")
      .fill(auth.createRunWorldDisplayName());
    const created = page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === "/v1/worlds" &&
        r.request().method() === "POST",
    );
    await dialog.getByRole("button", { name: "Create" }).click();
    const createResponse = await created;
    expect(createResponse.status()).toBe(201);
    worldId = ((await createResponse.json()) as { world: { id: string } }).world
      .id;
    await dialog.getByRole("button", { name: "Done" }).click();

    // The UI uses a world token saved in the browser; seed one.
    const worldToken = await auth.createWorldTokenViaApi(session, worldId);
    await page.addInitScript(
      ({ id, token }) => {
        localStorage.setItem(
          `wazoo_world_tokens_${id}`,
          JSON.stringify([{ name: "e2e", token }]),
        );
      },
      { id: worldId, token: worldToken },
    );

    // 2. Import the quickstart data by pasting it.
    await page.goto(`/worlds/${worldId}/import`);
    await page.getByRole("button", { name: "Paste text" }).click();
    await page.locator("textarea").fill(JSON.stringify(QUADS));
    await page.getByRole("button", { name: "Execute Import" }).click();
    await expect(page.getByText("Import Successful")).toBeVisible();
    await expect(page.getByText(/4 quads/)).toBeVisible();

    // 3. Query it and see the names.
    await page.goto(`/worlds/${worldId}/sparql`);
    await page.getByRole("button", { name: "Select all triples" }).click();
    await page.getByRole("button", { name: "Execute Query" }).click();
    await expect(
      page.getByRole("cell", { name: "Alice", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Bob", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Query returned 0 results")).toHaveCount(0);

    // 4. The platform applied the free plan's write budget and counted the
    //    import against it (4 quads is about 36 rows, plus the world itself).
    const plan = await auth.getUserPlanViaApi(session);
    expect(plan.plan).toBe("free");
    expect(plan.dailyRowWrites).toBeGreaterThan(0);
    expect(plan.rowsWrittenToday).toBeGreaterThan(0);
    expect(plan.rowsWrittenToday).toBeLessThan(plan.dailyRowWrites!);
  } finally {
    if (worldId) await auth.deleteWorldViaApi(session, worldId);
  }
});
