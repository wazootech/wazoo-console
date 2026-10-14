#!/usr/bin/env node

// Credential-free production canary for wazoo-console. Read-only GETs only.
// Usage: node scripts/prod-canary.mjs [baseUrl]
// Only https://console.wazoo.dev is allowed; any other host is refused.

const ALLOWED_HOST = "console.wazoo.dev";
const TIMEOUT_MS = 10_000;
const ATTEMPTS = 2;

const input = process.argv[2] ?? process.env.CONSOLE_URL ?? `https://${ALLOWED_HOST}`;
let base;
try {
  const url = new URL(input);
  if (url.protocol !== "https:" || url.hostname !== ALLOWED_HOST) {
    throw new Error(`must be https://${ALLOWED_HOST}, got ${input}`);
  }
  base = url.origin;
} catch (err) {
  console.error(`Refusing target: ${err.message}`);
  process.exit(1);
}

async function get(path, init = {}) {
  let lastError;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      return await fetch(`${base}${path}`, {
        ...init,
        method: "GET",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

const failures = [];

try {
  const res = await get("/api/health");
  const body = await res.json().catch(() => null);
  if (res.status === 200 && body?.status === "ok") {
    console.log(`ok   GET /api/health -> 200 ${JSON.stringify(body)}`);
  } else {
    failures.push(`GET /api/health -> ${res.status} ${JSON.stringify(body)}`);
  }
} catch (err) {
  failures.push(`GET /api/health -> ${err}`);
}

try {
  const res = await get("/worlds", { redirect: "manual" });
  if (res.status >= 300 && res.status < 400) {
    console.log(`ok   GET /worlds (unauthenticated) -> ${res.status}`);
  } else {
    failures.push(`GET /worlds (unauthenticated) expected 3xx, got ${res.status}`);
  }
} catch (err) {
  failures.push(`GET /worlds -> ${err}`);
}

if (failures.length > 0) {
  for (const f of failures) console.error(`FAIL ${f}`);
  process.exit(1);
}
console.log(`Production canary passed: ${base}`);
