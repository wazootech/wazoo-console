import { test, expect } from "@playwright/test";
import {
  clearTokenCookies,
  getTokenCookieName,
  hostTokenCookieName,
  legacyTokenCookieName,
  setTokenCookie,
  tokenCookieOptions,
} from "../src/lib/session-cookie";

type SetCall = { name: string; value: string; options: object };

function fakeStore() {
  const calls: SetCall[] = [];
  return {
    calls,
    set(name: string, value: string, options: object) {
      calls.push({ name, value, options });
    },
  };
}

test.describe("session cookie name", () => {
  test("uses the __Host- prefixed name in production", () => {
    expect(getTokenCookieName(true)).toBe("__Host-wazoo_console_token");
    expect(hostTokenCookieName).toBe("__Host-wazoo_console_token");
  });

  test("uses the plain name outside production", () => {
    expect(getTokenCookieName(false)).toBe("wazoo_console_token");
    expect(legacyTokenCookieName).toBe("wazoo_console_token");
  });

  test("follows NODE_ENV by default", () => {
    const env = process.env as Record<string, string | undefined>;
    const original = env.NODE_ENV;
    try {
      env.NODE_ENV = "production";
      expect(getTokenCookieName()).toBe(hostTokenCookieName);
      env.NODE_ENV = "development";
      expect(getTokenCookieName()).toBe(legacyTokenCookieName);
      env.NODE_ENV = "test";
      expect(getTokenCookieName()).toBe(legacyTokenCookieName);
    } finally {
      env.NODE_ENV = original;
    }
  });
});

test.describe("session cookie attributes", () => {
  test("satisfy __Host- rules in production: Secure, Path=/, no Domain", () => {
    const options = tokenCookieOptions(true);
    expect(options).toMatchObject({
      secure: true,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
    expect("domain" in options).toBe(false);
  });

  test("setTokenCookie writes the selected name with host-only options", () => {
    const store = fakeStore();
    const env = process.env as Record<string, string | undefined>;
    const original = env.NODE_ENV;
    try {
      env.NODE_ENV = "production";
      setTokenCookie(store, "tok");
    } finally {
      env.NODE_ENV = original;
    }
    expect(store.calls).toHaveLength(1);
    expect(store.calls[0].name).toBe(hostTokenCookieName);
    expect(store.calls[0].value).toBe("tok");
    expect(store.calls[0].options).toMatchObject({ secure: true, path: "/" });
    expect("domain" in store.calls[0].options).toBe(false);
  });
});

test.describe("clearing the session cookie", () => {
  test("production expires the new name and the legacy name", () => {
    const store = fakeStore();
    clearTokenCookies(store, true);
    expect(store.calls.map((c) => c.name)).toEqual([
      hostTokenCookieName,
      legacyTokenCookieName,
    ]);
    for (const call of store.calls) {
      expect(call.value).toBe("");
      expect(call.options).toMatchObject({ path: "/", httpOnly: true });
      expect((call.options as { expires: Date }).expires.getTime()).toBe(0);
      expect("domain" in call.options).toBe(false);
    }
    // __Host- deletes must carry Secure or browsers ignore them.
    expect(store.calls[0].options).toMatchObject({ secure: true });
  });

  test("development expires only the plain name", () => {
    const store = fakeStore();
    clearTokenCookies(store, false);
    expect(store.calls.map((c) => c.name)).toEqual([legacyTokenCookieName]);
    expect(store.calls[0].options).toMatchObject({ secure: false });
  });
});
