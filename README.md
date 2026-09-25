# Wazoo Console

Management-plane UI for the Wazoo private beta.

## Local dev

```sh
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Sign in through WorkOS AuthKit. The local callback is
`http://localhost:3000/callback`.

Required environment:

```sh
WORKOS_CLIENT_ID="client_..."
WORKOS_API_KEY="sk_test_..."
WORKOS_COOKIE_PASSWORD="<at least 32 characters>"
NEXT_PUBLIC_WORKOS_REDIRECT_URI="http://localhost:3000/callback"
WAZOO_PLATFORM_ADMIN_TOKEN="wzp_..."
NEXT_PUBLIC_API_URL="http://localhost:8080"
```

Local auth uses the official [WorkOS Emulate](https://github.com/workos/emulate)
server instead of the real WorkOS API. We chose `@workos/emulate` over
general-purpose emulators (e.g. `vercel-labs/emulate`) because it is
purpose-built for WorkOS and stays feature-complete for AuthKit flows, MFA,
SSO, and webhooks. `vercel-labs/emulate` does not include a WorkOS service.

Start the emulator alongside the dev server:

```sh
npm run dev:emulate:workos
```

The emulator serves WorkOS at [http://localhost:4100](http://localhost:4100)
and accepts any `WORKOS_CLIENT_ID`. Sign in with the seeded test user:

| Email                 | Password |
| --------------------- | -------- |
| `developer@wazoo.dev` | `dev`    |

The `--interactive` flag serves browser login pages so the full AuthKit
redirect flow works locally. Seed users are defined in
`workos-emulate.config.yaml`.

## Health checks

- Local: `npm run health:local`
- QA: `npm run health:qa`

The `/api/health` endpoint returns `{ "status": "ok" }` and a `200` status.

## Environment files

- `.env.local` — local development secrets (gitignored).
- `.env.qa` — QA reference values (gitignored).
- `.env.production` — production reference values (gitignored).
- `.env.local.example`, `.env.qa.example`, `.env.production.example` — committed templates.

## Deployment

Production deploys are human-in-the-loop. Do not deploy `console.wazoo.dev`
directly from a local shell for normal releases. Push the reviewed commit, then
run the `CI` workflow with `workflow_dispatch` from the intended branch. The
`deploy-prod` job waits for `verify` before publishing the top-level
`wazoo-console` Worker and custom domain.

Pushes to `main` also trigger `deploy-qa`, which publishes the
`wazoo-console-qa` Worker to the `qa` Wrangler environment and points it at
`api-qa.wazoo.dev`. Verify the QA Worker before dispatching a production deploy.

Pull requests deploy preview Workers with `wrangler.preview.jsonc`, which keeps
`workers_dev` enabled and defines no custom-domain routes. Do not deploy PR
previews with the production Wrangler config, because it owns
`console.wazoo.dev`. Preview deploys use non-secret AuthKit placeholder values
so the app can render and redirect without exposing production WorkOS/admin
secrets to pull request code; they are not intended for completing a real
WorkOS callback.

Required GitHub Actions secrets and variables:

```sh
CLOUDFLARE_ACCOUNT_ID     # secret
CLOUDFLARE_API_TOKEN      # secret
INFISICAL_MACHINE_ID      # variable (non-secret)
INFISICAL_PROJECT_SLUG    # variable (non-secret)
```

`WORKOS_*` and `WAZOO_PLATFORM_ADMIN_TOKEN` are no longer GitHub secrets: the
`deploy-qa` and `deploy-prod` jobs fetch them from Infisical at deploy time over
OIDC machine identity, and the Infisical syncs keep the Worker secrets current.
See `secret-registry.md` for the inventory and rotation rules.

Required Cloudflare Worker secrets for `wazoo-console`:

```sh
WORKOS_CLIENT_ID
WORKOS_API_KEY
WORKOS_COOKIE_PASSWORD
WAZOO_PLATFORM_ADMIN_TOKEN
```

`NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WORKOS_REDIRECT_URI` are set by the
production workflow to `https://api.wazoo.dev` and
`https://console.wazoo.dev/callback`. No CI job runs against production:
`deploy-prod` only publishes (the `e2e-qa` job covers the QA Worker on every
`main` push), so verify a production deploy by hand --
`https://console.wazoo.dev/api/health` must return `{ "status": "ok" }`.

For a full sign-in verification, smoke test `https://console.wazoo.dev/` and
confirm it returns a `307` redirect to hosted WorkOS with the production callback
URI. The redirect lives on the protected routes: `/sign-in/` itself serves the
sign-in page with a `200`, and Next normalizes the trailing slash
(`/sign-in` -> `/sign-in/`).
