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
- Translations (gt-next): `public/_gt/*.json` files are generated, not
  hand-written, and are gitignored. After a fresh checkout, run
  `npx gt generate` once so `next dev`/`tsc` compile (`src/loadTranslations.ts`
  imports those files). Wrapping UI strings: use `<T>` for JSX and `useGT()`
  for plain strings; add locales in `gt.config.json`.
