// Session cookie naming and attributes, the single source of truth.
//
// In production the cookie uses the `__Host-` prefix: browsers refuse to store
// it unless it is Secure, has Path=/, and has no Domain attribute. That blocks
// cookie tossing from sibling subdomains (e.g. a PR preview on another
// *.wazoo.dev host setting Domain=.wazoo.dev). `__Host-` requires Secure, which
// fails over plain http://localhost, so dev and test keep the plain name.

export const legacyTokenCookieName = "wazoo_console_token";
export const hostTokenCookieName = `__Host-${legacyTokenCookieName}`;

const maxAgeSeconds = 60 * 60 * 24;

export function isSecureCookieEnv(): boolean {
  return process.env.NODE_ENV === "production";
}

export function getTokenCookieName(secure = isSecureCookieEnv()): string {
  return secure ? hostTokenCookieName : legacyTokenCookieName;
}

export interface TokenCookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge?: number;
  expires?: Date;
}

// Never sets `domain`: `__Host-` forbids it and host-only is what we want.
export function tokenCookieOptions(
  secure = isSecureCookieEnv(),
): TokenCookieOptions {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

interface CookieWriter {
  set(name: string, value: string, options: TokenCookieOptions): unknown;
}

export function setTokenCookie(store: CookieWriter, token: string): void {
  store.set(getTokenCookieName(), token, tokenCookieOptions());
}

// Expire the session cookie. Deletes are `set` calls with the same attributes
// as the original, because a `__Host-` delete without Secure is ignored by
// browsers. The legacy plain name is cleared too (transition period) so old
// cookies do not linger after the rename.
export function clearTokenCookies(
  store: CookieWriter,
  secure = isSecureCookieEnv(),
): void {
  const options = { ...tokenCookieOptions(secure), expires: new Date(0) };
  delete options.maxAge;
  for (const name of new Set([
    getTokenCookieName(secure),
    legacyTokenCookieName,
  ])) {
    store.set(name, "", options);
  }
}
