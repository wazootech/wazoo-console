import { test, expect } from "@playwright/test";
import {
  clearPreviewApiCache,
  previewApiCandidate,
  resolvePreviewApiUrl,
} from "../src/lib/preview-api";

const FALLBACK = "https://main.preview.api.wazoo.dev";

function fakeFetch(respond: (url: string) => Response | Promise<Response>) {
  const urls: string[] = [];
  const impl = async (input: string) => {
    urls.push(input);
    return respond(input);
  };
  return { urls, impl };
}

test.beforeEach(() => clearPreviewApiCache());

test.describe("previewApiCandidate", () => {
  test("maps a console preview host to the same-alias API preview", () => {
    expect(previewApiCandidate("my-branch.preview.console.wazoo.dev")).toBe(
      "https://my-branch.preview.api.wazoo.dev",
    );
    expect(previewApiCandidate("PR-12.Preview.Console.Wazoo.Dev:443")).toBe(
      "https://pr-12.preview.api.wazoo.dev",
    );
  });

  for (const host of [
    "a.b.preview.console.wazoo.dev",
    "preview.console.wazoo.dev",
    ".preview.console.wazoo.dev",
    "-x.preview.console.wazoo.dev",
    "x-.preview.console.wazoo.dev",
    "x.preview.console.wazoo.dev.evil.com",
    "evilpreview.console.wazoo.dev",
    "console.wazoo.dev",
    "console-qa.wazoo.dev",
    "localhost:3000",
    "",
    null,
    undefined,
  ]) {
    test(`rejects ${JSON.stringify(host)}`, () => {
      expect(previewApiCandidate(host)).toBeNull();
    });
  }
});

test.describe("resolvePreviewApiUrl", () => {
  test("returns null for non-preview hosts without probing", async () => {
    const { urls, impl } = fakeFetch(() => new Response("ok"));
    expect(
      await resolvePreviewApiUrl("console.wazoo.dev", FALLBACK, impl),
    ).toBeNull();
    expect(urls).toEqual([]);
  });

  test("uses the same-alias API preview when /health is ok", async () => {
    const { urls, impl } = fakeFetch(() => new Response("ok"));
    const url = await resolvePreviewApiUrl(
      "feat.preview.console.wazoo.dev",
      FALLBACK,
      impl,
    );
    expect(url).toBe("https://feat.preview.api.wazoo.dev");
    expect(urls).toEqual(["https://feat.preview.api.wazoo.dev/health"]);
  });

  test("falls back on a thrown fetch (DNS/TLS/timeout)", async () => {
    const { impl } = fakeFetch(() => {
      throw new TypeError("fetch failed");
    });
    expect(
      await resolvePreviewApiUrl("a.preview.console.wazoo.dev", FALLBACK, impl),
    ).toBe(FALLBACK);
  });

  test("falls back on a non-ok status", async () => {
    const { impl } = fakeFetch(() => new Response("nope", { status: 404 }));
    expect(
      await resolvePreviewApiUrl("b.preview.console.wazoo.dev", FALLBACK, impl),
    ).toBe(FALLBACK);
  });

  test("aborts a probe that hangs past the timeout", async () => {
    const impl = (_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(new Error("aborted")),
        );
      });
    expect(
      await resolvePreviewApiUrl("c.preview.console.wazoo.dev", FALLBACK, impl),
    ).toBe(FALLBACK);
  });

  test("skips the probe when the alias is main", async () => {
    const { urls, impl } = fakeFetch(() => new Response("ok"));
    expect(
      await resolvePreviewApiUrl(
        "main.preview.console.wazoo.dev",
        FALLBACK,
        impl,
      ),
    ).toBe(FALLBACK);
    expect(urls).toEqual([]);
  });

  test("caches per alias, with a short TTL for misses", async () => {
    let healthy = false;
    const { urls, impl } = fakeFetch(() =>
      healthy ? new Response("ok") : new Response("", { status: 522 }),
    );
    const host = "d.preview.console.wazoo.dev";
    expect(await resolvePreviewApiUrl(host, FALLBACK, impl, 0)).toBe(FALLBACK);
    healthy = true;
    expect(await resolvePreviewApiUrl(host, FALLBACK, impl, 1_000)).toBe(
      FALLBACK,
    );
    expect(urls).toHaveLength(1);
    expect(await resolvePreviewApiUrl(host, FALLBACK, impl, 31_000)).toBe(
      "https://d.preview.api.wazoo.dev",
    );
    expect(await resolvePreviewApiUrl(host, FALLBACK, impl, 60_000)).toBe(
      "https://d.preview.api.wazoo.dev",
    );
    expect(urls).toHaveLength(2);
  });
});
