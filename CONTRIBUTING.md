# Contributing to Wazoo Console

Thank you for contributing to the Wazoo Console. This guide covers how to set
up the local environment, run the full Wazoo stack, and follow our development
workflow.

## Prerequisites

- [Node.js](https://nodejs.org/) 22.11 or later
- [npm](https://www.npmjs.com/) (comes with Node.js)
- A GitHub account with access to the `wazootech` organization
- Optional: [Deno](https://deno.com/) for workspace-level scripts

## Workspace setup

The Wazoo Console lives inside the larger Wazoo multi-repo workspace. Do not
clone only `wazootech/wazoo-console`; use the workspace harness so all related
repositories are available.

1. Clone the workspace:

   ```sh
   git clone https://github.com/wazootech/workspace.git wazootech
   cd wazootech
   ```

2. Check the workspace state:

   ```sh
   deno task workspace:check
   ```

3. If any canonical repositories are missing, bootstrap them:

   ```sh
   deno task workspace:bootstrap
   ```

4. Keep default branches current:

   ```sh
   deno task workspace:update
   ```

See the top-level `AGENTS.md` for the full workspace conventions, worktree
workflow, and CI policy.

## Repository layout

```text
wazootech/
├── repos/
│   ├── wazoo-console/      # This repository
│   ├── wazoo-api/          # Control plane API
│   ├── worlds-api/         # Data plane API
│   └── ...
└── worktrees/              # Feature worktrees
```

## Worktree workflow

Always develop in a feature worktree, not directly on the `main` branch of the
canonical `repos/wazoo-console` checkout.

```sh
# From the workspace root
git -C repos/wazoo-console worktree add \
  ../../worktrees/wazoo-console/my-feature \
  -b my-feature

cd worktrees/wazoo-console/my-feature
```

When you are done, remove the worktree and prune stale references:

```sh
git -C repos/wazoo-console worktree remove worktrees/wazoo-console/my-feature
git -C repos/wazoo-console worktree prune
```

## Environment variables

Create a `.env.local` file in the repository root with at least the following
variables:

```sh
WORKOS_CLIENT_ID="client_emulator_default"
WORKOS_API_KEY="sk_test_default"
WORKOS_API_HOSTNAME="localhost:4100"
WORKOS_API_HTTPS="false"
WORKOS_COOKIE_PASSWORD="local-dev-cookie-password-at-least-32-chars!!"
NEXT_PUBLIC_WORKOS_REDIRECT_URI="http://localhost:3000/callback"
NEXT_PUBLIC_API_URL="http://localhost:8080"
WAZOO_PLATFORM_ADMIN_TOKEN="wzp_..."
```

`WAZOO_PLATFORM_ADMIN_TOKEN` must connect to the local control plane. For
QA/prod access, the token must be environment-specific and must never be
committed.

## Local development

### Install dependencies

```sh
npm install
```

### Start the WorkOS emulator

We use the official
[`@workos/emulate`](https://github.com/workos/emulate) package for local
authentication. We chose it over general-purpose emulators such as
`vercel-labs/emulate` because it is maintained by WorkOS and stays
feature-complete for AuthKit login, MFA, SSO, and webhook flows.

```sh
npm run dev:emulate:workos
```

The emulator runs on `http://localhost:4100` and accepts any
`WORKOS_CLIENT_ID`. The seeded test user is:

| Email                 | Password |
| --------------------- | -------- |
| `developer@wazoo.dev` | `dev`    |

### Start the console

In a second terminal, from the same worktree:

```sh
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Sign in

Click through the local AuthKit login page and sign in with the seeded user
above. The local callback is `http://localhost:3000/callback`.

## Full-stack local development

To exercise the console against a real local backend, also run:

- `wazoo-api` (control plane) — see `repos/wazoo-api/README.md`
- `worlds-api` (data plane) — see `repos/worlds-api/README.md`

Both repositories have Docker Compose files. A typical local stack looks like
this:

```text
Terminal 1: wazoo-api      -> npm run dev      (or docker compose up)
Terminal 2: worlds-api      -> npm run dev      (or docker compose up)
Terminal 3: workos-emulate -> npm run dev:emulate:workos
Terminal 4: wazoo-console  -> npm run dev
```

Make sure `NEXT_PUBLIC_API_URL` and `WAZOO_PLATFORM_ADMIN_TOKEN` point at the
local `wazoo-api` instance.

## Code style and conventions

- Use the existing frontend design system.
- Keep operational screens dense, clear, and task-focused.
- Follow the `package.json` scripts for dev, build, typecheck, formatting, and
  deploy commands.
- Run `npm run typecheck` and the narrowest relevant build for code changes.
- Run `npm run format` before committing.
- Do not commit `.env.local` or other secret files.
- Keep line endings as LF.

## Testing

- Type check: `npm run typecheck`
- Format check: `npm run format:check`
- Health check: `npm run health:local`

Manual QA is required for the hosted WorkOS auth flow because Cloudflare
Turnstile CAPTCHA blocks headless browsers.

## Deployment

Production deploys are human-in-the-loop.

1. Push the reviewed branch to GitHub.
2. Create a pull request.
3. Wait for CI to pass (`verify`, `deploy-preview`).
4. Merge to `main`.
5. Pushes to `main` automatically deploy to the QA environment.
6. Verify `https://console-qa.wazoo.dev`.
7. Dispatch the `deploy-prod` workflow manually only after QA verification.

Do not deploy `console.wazoo.dev` directly from a local shell for normal
releases.

## Required secrets

For CI/CD, the following GitHub Actions secrets must be set:

```sh
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
WORKOS_CLIENT_ID
WORKOS_API_KEY
WORKOS_COOKIE_PASSWORD
WAZOO_PLATFORM_ADMIN_TOKEN
```

For Cloudflare Worker runtime secrets:

```sh
WORKOS_CLIENT_ID
WORKOS_API_KEY
WORKOS_COOKIE_PASSWORD
WAZOO_PLATFORM_ADMIN_TOKEN
```

See `secret-registry.md` for the full secret inventory, AuthKit settings, and
security rules.

## QA checklist before inviting beta users

1. **Sign-in redirect**: `https://console-qa.wazoo.dev/sign-in/` returns `307`
   to `https://api.workos.com/user_management/authorize` with
   `redirect_uri=https%3A%2F%2Fconsole-qa.wazoo.dev%2Fcallback`.
2. **Production redirect**: Same for `https://console.wazoo.dev/sign-in/`.
3. **Full login flow (manual)**: Complete email/password or OAuth sign-in on the
   WorkOS hosted page, confirm redirect back to the console, and confirm the
   session persists across navigation.
4. **Allowlist gate**: Confirm approved beta emails can sign in and that
   non-approved emails are rejected by the console allowlist check.
5. **Sign-out**: Confirm sign-out clears the session and does not leave a
   redirect loop.
6. **Data-plane smoke**: Create a World, import data, run a SPARQL query, and
   verify results render.

## How to contribute

1. Open or claim an issue.
2. Create a feature worktree.
3. Make focused, atomic commits.
4. Run `npm run typecheck` and `npm run format:check`.
5. Push your branch and open a pull request.
6. Wait for CI to pass.
7. Request review from a maintainer.

## Getting help

- General Wazoo workspace questions: see the workspace `AGENTS.md`.
- Console-specific conventions: see `AGENTS.md` in this repository.
- Auth and deployment details: see `secret-registry.md`.
- Private beta signup and allowlist: see
  `wazootech/wazoopedia/wiki/Private_Beta_Signup.md`.

## Useful links

- [WorkOS Emulate](https://github.com/workos/emulate)
- [WorkOS AuthKit docs](https://workos.com/docs/authkit)
- [Cloudflare Workers docs](https://developers.cloudflare.com/workers/)
- [Wazoopedia](https://github.com/wazootech/wazoopedia)
