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
WAZOO_CONSOLE_ADMIN_TOKEN="wzp_..."
NEXT_PUBLIC_API_URL="http://localhost:8080"
```

`WAZOO_PLATFORM_ADMIN_TOKEN` is also accepted for parity with the Cloudflare
Worker secret name.

To run the Vercel OAuth emulator for WorkOS provider development:

```sh
npm run dev:emulate:vercel
```

The emulator serves Vercel at [http://localhost:4000](http://localhost:4000)
with client ID `emu_vercel_client_id` and client secret
`emu_vercel_client_secret`.
