# Secret Registry

## Canonical source: Infisical

As of 2026-09-10, the canonical source for all runtime secrets is the
[Infisical](https://infisical.com) project configured in the workspace-level
migration runbook (`infisical-secrets-migration.md` at the root of the
wazootech workspace repo). That runbook owns the full secret inventory, the
QA/prod separation, and the cutover sequence.

- Local plaintext files (`.env.local`, `.dev.vars`) are derived, disposable dev
  copies. Do not treat them as a source of truth; regenerate them from Infisical
  (`infisical secrets generate .env.local --env dev`) and never copy-paste
  secret values between machines or environments by hand.
- CI fetches runtime secrets from Infisical at deploy time via OIDC machine
  identity (no Infisical credentials are stored in GitHub). The legacy
  `WAZOO_PLATFORM_ADMIN_TOKEN` / `WORKOS_*` GitHub secrets are retired after
  cutover; keep only `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and the
  two Infisical **variables** (`INFISICAL_MACHINE_ID`,
  `INFISICAL_PROJECT_SLUG`, non-secret) in GitHub.
- Secret values are never documented here — only their names, owners, and
  rotation dates.

## wazoo-console

| Secret                     | Infisical env | Prod Worker | QA Worker | Rotated    | Security Rule                                                                                                                     |
| -------------------------- | ------------- | ----------- | --------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------- |
| WORKOS_CLIENT_ID           | dev, qa, prod | yes         | yes       | 2026-09-10 | Identical for staging AuthKit instance.                                                                                           |
| WORKOS_API_KEY             | dev, qa, prod | yes         | yes       | 2026-09-10 | Staging API key.                                                                                                                  |
| WORKOS_COOKIE_PASSWORD     | qa, prod      | yes         | yes       | 2026-09-10 | Environment-specific random 32-byte secret.                                                                                       |
| WAZOO_PLATFORM_ADMIN_TOKEN | qa, prod      | yes         | yes       | 2026-09-10 | MUST be distinct between QA and Prod. QA token connects only to `api-qa.wazoo.dev`; Prod token connects only to `api.wazoo.dev`.  |

Last audited: 2026-09-10

## WorkOS environment variables

| Variable                          | Value                                       | Notes                                                                  |
| --------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------- |
| `NEXT_PUBLIC_WORKOS_REDIRECT_URI` | QA: `https://console-qa.wazoo.dev/callback` | Inlined at build time via Webpack. Set as env var before `next build`. |
| `NEXT_PUBLIC_API_URL`             | QA: `https://api-qa.wazoo.dev`              | Inlined at build time.                                                 |
| `WORKOS_REDIRECT_URI`             | Auto-derived from `NEXT_PUBLIC_*`           | Used by `@workos-inc/authkit-nextjs` middleware.                       |
| `E2E_AUTH_BYPASS_ENABLED`         | QA Worker: `true`; Prod/preview: unset      | Runtime-only gate for `POST /api/auth/bypass` (see below).             |

## Bypass auth gate

`POST /api/auth/bypass` (`src/app/api/auth/bypass/route.ts`) is a
passwordless-session backdoor for QA/dev use: possession of any valid platform
token that resolves via `/v1/users/me` yields a console session. It is only
mounted when the runtime var `E2E_AUTH_BYPASS_ENABLED === "true"`; otherwise it
returns 404.

- **Production Worker** (`console.wazoo.dev`): var unset -> route disabled.
- **QA Worker** (`console-qa.wazoo.dev`): var set in `wrangler.jsonc`
  `env.qa.vars` -> route enabled (used by the live world-creation e2e gate).
- **Preview Workers** (`wazoo-console-pr-N`): var unset -> route disabled.
- **Local dev**: opt-in via `.env.local` (`E2E_AUTH_BYPASS_ENABLED=true`);
  unset by default.

## WorkOS redirect URIs (staging environment)

| URI                                     | Default | Notes                   |
| --------------------------------------- | ------- | ----------------------- |
| `http://localhost:3000/callback`        | yes     | Local dev               |
| `https://console-qa.wazoo.dev/callback` | no      | QA Worker               |
| `https://console.wazoo.dev/callback`    | no      | Production              |
| `https://console.wazoo.tech/callback`   | no      | Legacy/alternate domain |

## AuthKit settings (staging)

| Setting                     | Value                              |
| --------------------------- | ---------------------------------- |
| Email verification required | `true`                             |
| Password auth               | enabled                            |
| GitHub OAuth                | enabled                            |
| Google OAuth                | enabled                            |
| Magic auth                  | enabled                            |
| MFA                         | Off                                |
| Waitlist                    | disabled                           |
| Sign-up                     | allowed                            |
| Password minimum length     | 10                                 |
| Password minimum strength   | 3                                  |
| Turnstile CAPTCHA           | enabled (blocks headless browsers) |

## Build configuration

- **Build command**: `next build --webpack` (NOT Turbopack — Turbopack breaks OpenNext chunking)
- **OpenNext config**: `open-next.config.ts` with `defineCloudflareConfig({})` — `buildCommand` is ignored by OpenNext
- **Worker size**: ~6284 KiB (webpack) vs ~3817 KiB (turbopack)

## MCP servers (workspace opencode.json)

| Server          | Type   | URL                          | Auth  | Notes                                 |
| --------------- | ------ | ---------------------------- | ----- | ------------------------------------- |
| workos          | remote | `https://mcp.workos.com/mcp` | OAuth | User management, branding, audit logs |
| mintlify        | remote | `https://mcp.mintlify.com`   | OAuth | Documentation read/write, PR creation |
| chrome-devtools | local  | npx chrome-devtools-mcp      | none  | Browser debugging, screenshots        |

Tokens stored in `~/.local/share/opencode/mcp-auth.json`. These are per-user, not shared — each developer authenticates independently. Do not commit this file.

## Deployment flow

1. Push to `main` triggers CI (`ci.yml`)
2. CI sets `NEXT_PUBLIC_*` env vars for QA builds
3. CI fetches runtime secrets from Infisical (OIDC machine identity, `qa` env)
4. `wrangler deploy` uploads Worker to Cloudflare
5. Continuous secrets sync is owned by the Infisical Cloudflare Workers Secret
   Syncs configured in `infisical-secrets-migration.md`; deploys no longer set
   worker secrets by hand
6. Runtime vars in `wrangler.jsonc` QA env block provide non-build-time config

## Local emulator (`@workos/emulate`)

Local dev uses the official `@workos/emulate` package instead of the real
WorkOS API:

- **Seed**: `workos-emulate.config.yaml` defines test users.
- **Port**: `localhost:4100` (configurable via `--port`).
- **API key**: `sk_test_default` (any value works).
- **Interactive mode**: `--interactive` flag serves HTML login pages for browser
  testing.
- **Script**: `npm run dev:emulate:workos` starts the emulator.

We use `@workos/emulate` rather than general-purpose alternatives such as
`vercel-labs/emulate` because it is maintained by WorkOS and stays
feature-complete for AuthKit login, MFA, SSO, and webhook flows.
`vercel-labs/emulate` does not emulate WorkOS.

## QA checklist before inviting beta users

Manual testing is required because Cloudflare Turnstile CAPTCHA on the hosted
WorkOS auth pages blocks headless browser automation.

1. **Sign-in redirect**: `https://console-qa.wazoo.dev/sign-in/` must return a
   `307` redirect to `https://api.workos.com/user_management/authorize` with
   `redirect_uri=https%3A%2F%2Fconsole-qa.wazoo.dev%2Fcallback`.
2. **Prod redirect**: Same check for `https://console.wazoo.dev/sign-in/` with
   `redirect_uri=https%3A%2F%2Fconsole.wazoo.dev%2Fcallback`.
3. **Full login flow (manual)**: Complete email/password or OAuth sign-in on
   the WorkOS hosted page, confirm redirect back to the console, and confirm
   the session persists across navigation.
4. **Allowlist gate**: Confirm approved beta emails can sign in and that
   non-approved emails are rejected by the console allowlist check.
5. **Sign-out**: Confirm sign-out clears the session and does not leave a
   redirect loop.
6. **Data-plane smoke**: Create a World, import data, run a SPARQL query, and
   verify results render.

## Known issues

- **Turnstile blocks automated testing**: Cloudflare Turnstile CAPTCHA on WorkOS auth pages prevents headless browser testing. Manual testing required. Not an issue locally — the emulator has no CAPTCHA.
- **Email verification required**: New users must verify email before first login. WorkOS sandbox email delivery may be unreliable. Not an issue locally — seed users have `email_verified: true`.
- **Module-scope env vars**: `@workos-inc/authkit-nextjs` reads `process.env` at module scope. Webpack build inlines values correctly; Turbopack did not. No longer a local concern — the emulator is tolerant of env-var quirks.
