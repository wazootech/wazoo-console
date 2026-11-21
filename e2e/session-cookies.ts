import {
  hostTokenCookieName,
  legacyTokenCookieName,
} from "../src/lib/session-cookie";

// The server reads the `__Host-` name in production builds (`next start`, CI)
// and the plain name in dev, so seed both. `__Host-` requires Secure, Path=/,
// and no Domain attribute; Chromium accepts Secure cookies on http://localhost.
// Playwright rejects `url` together with `secure`, so use domain + path (a
// domain here is how Playwright addresses a host-only cookie, not a Domain
// attribute).
export function sessionCookies(baseURL: string, value: string) {
  const { hostname } = new URL(baseURL);
  return [
    { name: legacyTokenCookieName, value, url: baseURL },
    {
      name: hostTokenCookieName,
      value,
      domain: hostname,
      path: "/",
      secure: true,
    },
  ];
}
