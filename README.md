# Wazoo Console

Management-plane UI for the Wazoo private beta.

## Local dev

```sh
pnpm install
pnpm run dev
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
pnpm run dev:emulate:workos
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

- Local: `pnpm run health:local`
- QA: `pnpm run health:qa`

The `/api/health` endpoint returns `{ "status": "ok" }` and a `200` status.

## Environment files

- `.env.local` — local development secrets (gitignored).
- `.env.qa` — QA reference values (gitignored).
- `.env.production` — production reference values (gitignored).
- `.env.local.example`, `.env.qa.example`, `.env.production.example` — committed templates.

## Deployment

Production deploys are human-in-the-loop. Do not deploy `console.wazoo.dev`
directly from a local shell for normal releases. Merge the reviewed PR: there is
no QA environment. Cloudflare Workers Builds is connected to this repository on
the `wazoo-console` Worker. On each push to `main` it runs format, lint, and
type checks, builds with the production `NEXT_PUBLIC_*` values, and deploys the
top-level Worker and custom domain. The commands and the build token are Worker
settings in the Cloudflare dashboard (Settings, Builds), and builds for other
branches are off. To redeploy the current head, retry its latest build on the
Worker's Deployments page.

The browser regression checks (`scripts/ui-regression.sh`) run only in GitHub's
required `verify` check, because the Cloudflare build image cannot run the
browser. Cloudflare does not wait for that check, so watch `verify` on `main`.

GitHub Actions deploys nothing and holds no Cloudflare or Infisical credential.

Previews are not set up yet. The intended design follows.

PR previews come from Cloudflare Workers Builds, using
`wrangler.preview.jsonc`. The credential stays in Cloudflare and is scoped to a
separate `wazoo-console-preview` Worker, so it can't deploy QA or prod. Every
branch pushed to this repo gets a `<preview-name>.preview.console.wazoo.dev` URL,
and Cloudflare comments it on the PR. A preview calls the API preview with the
same alias (`https://<preview-name>.preview.api.wazoo.dev`) when its `/health`
answers within 1.5s, else `https://main.preview.api.wazoo.dev` (the API preview
that tracks main); only the preview Worker (`WAZOO_PREVIEW=true`) does this. Sign-in works
because the preview Worker derives the WorkOS callback from the request origin
(`WORKOS_REDIRECT_FROM_ORIGIN`), and WorkOS allowlists `https://*.preview.console.wazoo.dev/callback`.
Branch code runs with that Worker's QA secrets, so treat write access to this
repo as access to them.

Worker secrets are not GitHub secrets: the Infisical syncs keep them current.
See `SECRETS.md` for the inventory and rotation rules.

Required Cloudflare Worker secrets for `wazoo-console`:

```sh
WORKOS_CLIENT_ID
WORKOS_API_KEY
WORKOS_COOKIE_PASSWORD
WAZOO_PLATFORM_ADMIN_TOKEN
```

`NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WORKOS_REDIRECT_URI` are set by the
Cloudflare build command to `https://api.wazoo.dev` and
`https://console.wazoo.dev/callback`. When the `Workers Builds: wazoo-console`
check passes, `post-deploy.yml` runs credential-free read-only GETs against
production; for a manual check, `https://console.wazoo.dev/api/health` must return
`{ "status": "ok" }`.

For a full sign-in verification, smoke test `https://console.wazoo.dev/` and
confirm it returns a `307` redirect to hosted WorkOS with the production callback
URI. The redirect lives on the protected routes: `/sign-in/` itself serves the
sign-in page with a `200`, and Next normalizes the trailing slash
(`/sign-in` -> `/sign-in/`).

## E2E tests

Playwright's console base URL defaults to http://localhost:3000; start the local server before `pnpm run test:e2e`; CI runs only the hermetic specs (mocked API, no credentials); `BASE_URL` should only be set to a hosted console when intentionally targeting that environment.
