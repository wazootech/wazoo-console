#!/usr/bin/env bash
# Browser regression checks against a built app. GitHub's verify job and the
# Cloudflare build both run this, so a failing check stops a deploy.
# Run `pnpm run build` first. PLAYWRIGHT_INSTALL_ARGS adds installer flags.
set -euo pipefail

export NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3100/callback
export WORKOS_CLIENT_ID=client_preview_placeholder
export WORKOS_API_KEY=sk_test_preview_placeholder
export WORKOS_COOKIE_PASSWORD=preview-cookie-password-at-least-32-bytes

# shellcheck disable=SC2086
pnpm exec playwright install ${PLAYWRIGHT_INSTALL_ARGS:-} chromium

pnpm exec next start -p 3100 &
server=$!
trap 'kill "$server" 2>/dev/null || true' EXIT
for i in $(seq 1 60); do
  if curl -sf -o /dev/null http://localhost:3100/sign-in; then
    echo "Server ready after ${i}s"
    break
  fi
  sleep 1
done

# Hermetic allowlist only. Never run bare `pnpm exec playwright test` here:
# prod-health.spec.ts needs real WorkOS creds + open network (renders
# a WorkOS error page with placeholders).
BASE_URL=http://localhost:3100 pnpm exec playwright test \
  e2e/a11y.spec.ts \
  e2e/create-world.spec.ts \
  e2e/import-paste.spec.ts \
  e2e/plan-card.spec.ts \
  e2e/preview-api.spec.ts \
  e2e/quota-banner.spec.ts \
  e2e/quota-surfaces.spec.ts \
  e2e/session-cookie.spec.ts \
  e2e/world-canonical-identity.spec.ts \
  e2e/world-data-plane-id.spec.ts \
  e2e/workos-verified-email.spec.ts
