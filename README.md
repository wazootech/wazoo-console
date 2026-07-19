# Wazoo Console

SvelteKit console for the Wazoo private beta, deployed to Cloudflare Workers at `console.wazoo.dev`.

## Responsibility

- Browser UI for approved beta users.
- Cloudflare Access email handling.
- Google Sheets-backed beta allowlist check.
- Deployment config for this one UI: `wrangler.jsonc`, SvelteKit Cloudflare adapter, and CI.

The console consumes `wazoo-api`; it does not own backend orchestration.

## Configuration

- `PUBLIC_WAZOO_API_BASE_URL`: Wazoo Platform API, usually `https://api.wazoo.dev`.
- `BETA_ALLOWLIST_SHEET_ID`: Google Sheet ID containing beta allowlist approvals.
- `GOOGLE_SERVICE_ACCOUNT_KEY`: Worker secret containing the Sheets service-account JSON.

## Development

```sh
npm install
cp .env.example .env.local
npm run dev
npm run check
npm run build
```

## Deployment

```sh
npm run deploy
```

GitHub Actions validates formatting, Svelte checks, builds the Worker bundle, and deploys `console.wazoo.dev` on `main`.
