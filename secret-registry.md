# Secret Registry

## wazoo-console

| Secret | Prod Worker | QA Worker | GitHub Secrets | Source |
| --- | --- | --- | --- | --- |
| WORKOS_CLIENT_ID | yes | yes | yes | `.env.local` |
| WORKOS_API_KEY | yes | yes | yes | `.env.local` |
| WORKOS_COOKIE_PASSWORD | yes | yes | yes | `.env.local` |
| WAZOO_PLATFORM_ADMIN_TOKEN | yes | yes | yes | `.env.local` |

Last audited: 2026-07-24

## WorkOS environment variables

| Variable | Value | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_WORKOS_REDIRECT_URI` | QA: `https://console-qa.wazoo.dev/callback` | Inlined at build time via Webpack. Set as env var before `next build`. |
| `NEXT_PUBLIC_API_URL` | QA: `https://api-qa.wazoo.dev` | Inlined at build time. |
| `WORKOS_REDIRECT_URI` | Auto-derived from `NEXT_PUBLIC_*` | Used by `@workos-inc/authkit-nextjs` middleware. |

## WorkOS redirect URIs (staging environment)

| URI | Default | Notes |
| --- | --- | --- |
| `http://localhost:3000/callback` | yes | Local dev |
| `https://console-qa.wazoo.dev/callback` | no | QA Worker |
| `https://console.wazoo.dev/callback` | no | Production |
| `https://console.wazoo.tech/callback` | no | Legacy/alternate domain |

## AuthKit settings (staging)

| Setting | Value |
| --- | --- |
| Email verification required | `true` |
| Password auth | enabled |
| GitHub OAuth | enabled |
| Google OAuth | enabled |
| Magic auth | enabled |
| MFA | Off |
| Waitlist | disabled |
| Sign-up | allowed |
| Password minimum length | 10 |
| Password minimum strength | 3 |
| Turnstile CAPTCHA | enabled (blocks headless browsers) |

## Build configuration

- **Build command**: `next build --webpack` (NOT Turbopack — Turbopack breaks OpenNext chunking)
- **OpenNext config**: `open-next.config.ts` with `defineCloudflareConfig({})` — `buildCommand` is ignored by OpenNext
- **Worker size**: ~6284 KiB (webpack) vs ~3817 KiB (turbopack)

## MCP servers (workspace opencode.json)

| Server | Type | URL | Auth | Notes |
| --- | --- | --- | --- | --- |
| workos | remote | `https://mcp.workos.com/mcp` | OAuth | User management, branding, audit logs |
| mintlify | remote | `https://mcp.mintlify.com` | OAuth | Documentation read/write, PR creation |
| chrome-devtools | local | npx chrome-devtools-mcp | none | Browser debugging, screenshots |

Tokens stored in `~/.local/share/opencode/mcp-auth.json`. These are per-user, not shared — each developer authenticates independently. Do not commit this file.

## Deployment flow

1. Push to `main` triggers CI (`ci.yml`)
2. CI sets `NEXT_PUBLIC_*` env vars for QA builds (lines 82-87)
3. `wrangler deploy` uploads Worker to Cloudflare
4. Secrets set via `wrangler secret bulk` (see `secret-registry.md` above)
5. Runtime vars in `wrangler.jsonc` QA env block provide non-build-time config

## Known issues

- **Turnstile blocks automated testing**: Cloudflare Turnstile CAPTCHA on WorkOS auth pages prevents headless browser testing. Manual testing required.
- **Email verification required**: New users must verify email before first login. WorkOS sandbox email delivery may be unreliable.
- **Module-scope env vars**: `@workos-inc/authkit-nextjs` reads `process.env` at module scope. Webpack build inlines values correctly; Turbopack did not.
