# Agent guidelines

This file overrides the workspace root AGENTS.md for repo-specific guidance.

## What this repo is

This repository contains the Wazoo console application.

## How to work here

- Match the existing frontend design system and keep operational screens dense,
  clear, and task-focused.
- Use `package.json` scripts for dev, build, typecheck, formatting, and deploy
  commands.
- Run `npm run typecheck` and the narrowest relevant build for code changes when
  practical.
- Run `npm run test:e2e` for browser/API smoke tests against the deployed
  console. Set `BASE_URL` to target a different environment (default is production).
- Run `npm run health:local` to verify the health endpoint.
- Do not touch deploy targets or environment configuration unless the user asks.
