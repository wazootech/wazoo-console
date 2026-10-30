# Agent guidelines

This file overrides the workspace root AGENTS.md for repo-specific guidance.

## What this repo is

This repository contains the Wazoo console application.

## How to work here

- Match the existing frontend design system and keep operational screens dense,
  clear, and task-focused.
- Use `package.json` scripts for dev, build, typecheck, formatting, and deploy
  commands.
- Run `pnpm run typecheck` and the narrowest relevant build for code changes when
  practical.
- Run `pnpm run test:e2e` for browser/API tests against a local server by default.
  Playwright defaults to `http://localhost:3000` for the console, but live E2E
  API requests do not default to QA: they require explicit
  `WAZOO_E2E_API_BASE_URL` and `WAZOO_PLATFORM_ADMIN_TOKEN`. Set `BASE_URL` and
  `WAZOO_E2E_API_BASE_URL` only when intentionally targeting a hosted
  environment; E2E tests may write data.
- Run `pnpm run health:local` to verify the health endpoint.
- Do not touch deploy targets or environment configuration unless the user asks.

## Code health

Family-wide rules live in the [wazootech workspace constitution](https://github.com/wazootech/workspace/blob/main/AGENTS.md#code-health-standards); this repo's specifics:

- Before pushing, run `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck`, plus the narrowest relevant build; CI runs the same checks. Lint uses `--max-warnings 0` (typescript-eslint recommended plus `eslint-config-next/core-web-vitals`).
- `@typescript-eslint/no-explicit-any` is an error. `react-hooks/set-state-in-effect` is off pending a Suspense refactor of the 13 fetch-on-mount effects; do not add new ones.
- `unrs-resolver: false` in `pnpm-workspace.yaml` is deliberate (prebuilt binaries); do not turn it on.
- Workflow actions are pinned to full commit SHAs with a version comment; Node comes from `.node-version`; installs are frozen. Deploy and publish jobs are approval-gated; pin them but change nothing else without asking.
- `secret-scan.yml` runs gitleaks on every pull request and push to `main`. `code-health.yml` enforces the file-length limit (120 lines of code per file, 300 for tests; blank, comment, and import or re-export lines excluded) and fails the check on any larger file; an explicit `ALLOWLIST` in the workflow may only shrink, and is empty today. Its TODO/FIXME check still only warns. `CODEOWNERS` routes review to `@EthanThatOneKid`.
