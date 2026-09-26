import { test, expect } from "@playwright/test";

// Boundary regression for the sign-in bootstrap endpoint
// (wazootech/wazoo-console#96).
//
// `POST /api/auth/sign-in` is a pre-authentication endpoint: it validates the
// age confirmation and returns JSON `{ url }` for the browser to navigate to.
// When AuthKit's middleware does not list the path in `unauthenticatedPaths` it
// intercepts the request first and answers `303` to `api.workos.com`. The
// browser's `fetch()` then follows a cross-origin redirect and rejects with
// `TypeError: Failed to fetch` (CORS), so the gate can never reach WorkOS and
// the component's error path is what a real user sees.
//
// These checks pin the contract at the HTTP boundary — where the component's
// mocked specs cannot see it — by refusing to follow redirects. Run against a
// deployed console (QA or production) where real WorkOS credentials exist.

const SIGN_IN_ENDPOINT = "/api/auth/sign-in";

test.describe("sign-in API boundary", () => {
  test("reaches the route handler and answers JSON instead of a redirect", async ({
    request,
  }) => {
    const res = await request.post(SIGN_IN_ENDPOINT, {
      data: { ageConfirmed: true },
      maxRedirects: 0,
    });

    expect(
      res.status(),
      `expected the sign-in route to answer 200, got ${res.status()} (a 3xx means the middleware intercepted it)`,
    ).toBe(200);

    const body = (await res.json()) as { url?: string };
    expect(typeof body.url).toBe("string");
    expect(body.url).toContain("workos.com");
  });

  test("never hands the browser a cross-origin WorkOS redirect", async ({
    request,
  }) => {
    const res = await request.post(SIGN_IN_ENDPOINT, {
      data: { ageConfirmed: true },
      maxRedirects: 0,
    });

    expect(res.headers()["location"] ?? "").not.toContain("api.workos.com");
    expect(res.status()).toBeLessThan(300);
  });

  test("still requires the age confirmation", async ({ request }) => {
    const res = await request.post(SIGN_IN_ENDPOINT, {
      data: {},
      maxRedirects: 0,
    });

    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: { code?: string } };
    expect(body.error?.code).toBe("AGE_GATE_REQUIRED");
  });

  test("a protected console path still redirects to sign-in", async ({
    request,
  }) => {
    const res = await request.get("/worlds", { maxRedirects: 0 });

    expect(res.status()).toBeGreaterThanOrEqual(300);
    expect(res.status()).toBeLessThan(400);
  });
});
