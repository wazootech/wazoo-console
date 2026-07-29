#!/usr/bin/env node

// Health check for wazoo-console.
// Usage: node scripts/health.mjs [baseUrl]
// Defaults to http://localhost:3000 for local dev.

const BASE_URL = process.argv[2] ?? process.env.CONSOLE_BASE_URL ?? "http://localhost:3000";

const url = `${BASE_URL.replace(/\/$/, "")}/api/health`;
const res = await fetch(url);

if (!res.ok) {
  console.error(`Health check failed: ${res.status} ${res.statusText}`);
  process.exit(1);
}

const body = await res.json();
if (body.status !== "ok") {
  console.error(`Unexpected health response: ${JSON.stringify(body)}`);
  process.exit(1);
}

console.log(`Health check passed: ${url} -> ${JSON.stringify(body)}`);
