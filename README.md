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

Required GitHub Actions secrets:

```sh
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
WORKOS_CLIENT_ID
WORKOS_API_KEY
WORKOS_COOKIE_PASSWORD
WAZOO_PLATFORM_ADMIN_TOKEN
```

Required Cloudflare Worker secrets for `wazoo-console`:

```sh
WORKOS_CLIENT_ID
WORKOS_API_KEY
WORKOS_COOKIE_PASSWORD
WAZOO_PLATFORM_ADMIN_TOKEN
```

`NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WORKOS_REDIRECT_URI` are set by the
production workflow to `https://api.wazoo.dev` and
`https://console.wazoo.dev/callback`. After deployment, smoke test
`https://console.wazoo.dev/sign-in/` and confirm it returns a `307` redirect to
hosted WorkOS with the production callback URI.
