import { createClient, createWorld, createWorldToken, deleteWorld } from "@wazoo/client";

const MGMT_BASE = "https://api.wazoo.dev";
const DATA_BASE = "https://worlds-api.wazoo.dev";
const PLATFORM_TOKEN = process.env.WAZOO_PLATFORM_TOKEN;

if (!PLATFORM_TOKEN) {
  console.error("Set WAZOO_PLATFORM_TOKEN environment variable (wzp_...)");
  process.exit(1);
}

const slug = `test-${Date.now()}`;

const mgmt = createClient({
  auth: PLATFORM_TOKEN,
  throwOnError: false,
  baseUrl: MGMT_BASE,
});

async function dataFetch(path: string, token: string, body: object) {
  return fetch(`${DATA_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

async function main() {
  // ── Step 1: Create world ──
  console.log(`\n=== Step 1: Create world "${slug}" ===`);
  const created = await createWorld({
    client: mgmt,
    body: { worldId: slug, world: { displayName: "Test World", region: "auto" } },
  });
  if (created.error) {
    console.error("Create failed:", JSON.stringify(created.error, null, 2));
    process.exit(1);
  }
  console.log(`Created: ${created.data!.world.worldId} (${created.data!.world.state})`);

  // ── Step 2: Create world auth token ──
  console.log(`\n=== Step 2: Create world token ===`);
  const tokenRes = await createWorldToken({
    client: mgmt,
    path: { worldId: slug },
    body: { name: "test-token" },
  });
  if (tokenRes.error) {
    console.error("Token creation failed:", JSON.stringify(tokenRes.error, null, 2));
    await cleanup();
    process.exit(1);
  }
  const worldToken: string = (tokenRes.data as any)?.token?.token;
  if (!worldToken) {
    console.error("Could not extract token secret:", JSON.stringify(tokenRes.data, null, 2));
    await cleanup();
    process.exit(1);
  }
  console.log(`World token: ${worldToken.slice(0, 12)}...`);

  // ── Step 3: Insert data via SPARQL UPDATE ──
  console.log(`\n=== Step 3: SPARQL INSERT DATA ===`);
  const insertRes = await dataFetch(`/worlds/${slug}/sparql`, worldToken, {
    query: `PREFIX ex: <http://example.org/>
INSERT DATA {
  ex:Alice ex:name "Alice" ;
           ex:age "30" ;
           ex:city "Portland" .
}`,
  });

  if (!insertRes.ok) {
    console.error(`INSERT failed (${insertRes.status}):`, await insertRes.text());
    await cleanup();
    process.exit(1);
  }
  console.log(`INSERT: ${insertRes.status} OK`);

  // ── Step 4: Query via SPARQL SELECT ──
  console.log(`\n=== Step 4: SPARQL SELECT ===`);
  const sparqlRes = await dataFetch(`/worlds/${slug}/sparql`, worldToken, {
    query: `PREFIX ex: <http://example.org/>
SELECT ?name ?age ?city WHERE {
  ex:Alice ex:name ?name ;
           ex:age ?age ;
           ex:city ?city .
}`,
  });

  if (!sparqlRes.ok) {
    console.error(`SELECT failed (${sparqlRes.status}):`, await sparqlRes.text());
    await cleanup();
    process.exit(1);
  }

  const results = await sparqlRes.json();
  console.log(JSON.stringify(results, null, 2));

  const bindings = results?.results?.bindings as any[] | undefined;
  if (!bindings?.length) {
    console.error("FAIL: No results");
    await cleanup();
    process.exit(1);
  }

  const b = bindings[0];
  const name = b.name?.value;
  const age = b.age?.value;
  const city = b.city?.value;
  console.log(`\nResult: name="${name}", age="${age}", city="${city}"`);

  let passed = true;
  if (name !== "Alice") { console.error(`FAIL: expected Alice, got ${name}`); passed = false; }
  if (age !== "30") { console.error(`FAIL: expected 30, got ${age}`); passed = false; }
  if (city !== "Portland") { console.error(`FAIL: expected Portland, got ${city}`); passed = false; }

  await cleanup();

  console.log(passed ? "\n=== ALL TESTS PASSED ===" : "\n=== SOME TESTS FAILED ===");
  process.exit(passed ? 0 : 1);
}

async function cleanup() {
  console.log(`\n=== Cleanup: Deleting "${slug}" ===`);
  const r = await deleteWorld({ client: mgmt, path: { worldId: slug } });
  if (r.error) {
    console.warn("Cleanup failed:", JSON.stringify(r.error));
  } else {
    console.log("Deleted.");
  }
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
