import { test, expect } from "@playwright/test";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";
const WORLDS_API_URL = process.env.WORLDS_API_URL ?? "http://localhost:8081";
const ADMIN_TOKEN = process.env.WAZOO_PLATFORM_ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
  throw new Error(
    "WAZOO_PLATFORM_ADMIN_TOKEN is required. Generate one locally with " +
      "`npm run launch:seed-admin` in wazoo-api and export it before running this spec.",
  );
}

const runId = Date.now();
const slug = `e2e-${runId}`;
const ADMIN_EMAIL = `e2e+${runId}@wazoo.dev`;

test.describe("world lifecycle", () => {
  test.afterAll(async ({ request }) => {
    const res = await request.delete(
      `${API_BASE_URL}/v1/worlds/${slug}?email=${encodeURIComponent(ADMIN_EMAIL)}`,
      {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      },
    );
    if (res.ok()) {
      console.log(`Cleaned up world ${slug}`);
    }
  });

  test("create world, insert SPARQL data, and SELECT it back", async ({
    request,
  }) => {
    // ── Step 0: Ensure owner user exists ──
    const userRes = await request.get(
      `${API_BASE_URL}/v1/users/me?email=${encodeURIComponent(ADMIN_EMAIL)}`,
      { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } },
    );
    expect(
      userRes.status(),
      `ensure user: ${userRes.status()}`,
    ).toBeGreaterThanOrEqual(200);
    expect(userRes.status()).toBeLessThan(300);

    // ── Step 1: Create world ──
    const createRes = await request.post(`${API_BASE_URL}/v1/worlds`, {
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
        "Content-Type": "application/json",
      },
      data: {
        worldId: slug,
        ownerEmail: ADMIN_EMAIL,
        world: { displayName: "E2E Test", region: "auto" },
      },
    });
    expect(createRes.status(), `create world: ${createRes.status()}`).toBe(201);
    const created = await createRes.json();
    expect(created.world.state).toBe("ACTIVE");

    // ── Step 2: Create world auth token ──
    const tokenRes = await request.post(
      `${API_BASE_URL}/v1/worlds/${slug}/auth/tokens?email=${encodeURIComponent(ADMIN_EMAIL)}`,
      {
        headers: {
          Authorization: `Bearer ${ADMIN_TOKEN}`,
          "Content-Type": "application/json",
        },
        data: { name: "e2e-test-token" },
      },
    );
    expect(tokenRes.status(), `create token: ${tokenRes.status()}`).toBe(201);
    const tokenBody = await tokenRes.json();
    const worldToken: string = tokenBody.token?.token;
    expect(worldToken).toBeTruthy();

    // ── Step 3: SPARQL INSERT DATA ──
    const insertRes = await request.post(
      `${WORLDS_API_URL}/worlds/${slug}/sparql`,
      {
        headers: {
          Authorization: `Bearer ${worldToken}`,
          "Content-Type": "application/json",
        },
        data: {
          query: `PREFIX ex: <http://example.org/>
INSERT DATA {
  ex:Alice ex:name "Alice" ;
           ex:age "30" ;
           ex:city "Portland" .
}`,
        },
      },
    );
    expect(insertRes.status(), `sparql insert: ${insertRes.status()}`).toBe(
      200,
    );

    // ── Step 4: SPARQL SELECT and verify ──
    const selectRes = await request.post(
      `${WORLDS_API_URL}/worlds/${slug}/sparql`,
      {
        headers: {
          Authorization: `Bearer ${worldToken}`,
          "Content-Type": "application/json",
        },
        data: {
          query: `PREFIX ex: <http://example.org/>
SELECT ?name ?age ?city WHERE {
  ex:Alice ex:name ?name ;
           ex:age ?age ;
           ex:city ?city .
}`,
        },
      },
    );
    expect(selectRes.status(), `sparql select: ${selectRes.status()}`).toBe(
      200,
    );
    const results = await selectRes.json();

    const bindings = results?.results?.bindings as
      Array<Record<string, { value: string }>> | undefined;
    expect(bindings?.length).toBeGreaterThanOrEqual(1);

    const b = bindings![0];
    expect(b.name?.value).toBe("Alice");
    expect(b.age?.value).toBe("30");
    expect(b.city?.value).toBe("Portland");
  });
});
