# Wazoo Console

SvelteKit Console for Wazoo private beta applications and admin review, deployed to Cloudflare Workers.

## Setup

```sh
npm install
cp .dev.vars.example .dev.vars
cp .env.example .env.local
```

Required configuration:

- `PUBLIC_WAZOO_API_BASE_URL`: Wazoo Platform API, usually `https://api.wazoo.dev`.
- `PUBLIC_TURNSTILE_SITE_KEY`: public Turnstile site key for the beta form.
- `WAZOO_PLATFORM_ADMIN_TOKEN`: server-only `wzp_` global admin token for `/admin`.

## Development

```sh
npm run dev
npm run check
npm run build
```

## Cloudflare

```sh
npm run preview
npm run deploy
```

Beta applications and admin review use SvelteKit server actions. The admin token is only read server-side.
