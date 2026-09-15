import { test, expect, type Page } from "@playwright/test";

const SESSION_BODY = {
  token: "e2e-platform-token",
  user: {
    uid: "usr_e2e_invalid_token",
    email: "invalid-token-e2e@example.com",
    displayName: "Invalid Token E2E",
    state: "ACTIVE",
    createTime: "2026-01-01T00:00:00Z",
  },
};

async function signIn(page: Page) {
  const baseURL = test.info().project.use.baseURL;
  if (!baseURL) throw new Error("baseURL is required for this spec");

  await page.context().addCookies([
    {
      name: "wazoo_console_token",
      value: "e2e-platform-token",
      url: baseURL,
    },
  ]);
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({ json: SESSION_BODY }),
  );
}

async function selectToken(page: Page, worldId: string) {
  await page.addInitScript(
    ({ worldId }) => {
      localStorage.setItem(
        `wazoo_world_tokens_${worldId}`,
        JSON.stringify([{ name: "Saved token", token: "wzp_invalid" }]),
      );
    },
    { worldId },
  );
  await page.reload();
  await expect(page.getByRole("combobox")).toContainText("Saved token");
}

async function mockApiResponse(
  page: Page,
  path: string,
  response: Parameters<Parameters<Page["route"]>[1]>[0],
) {
  await page.route(`**${path}`, (route) => {
    if (route.request().resourceType() === "document") return route.continue();
    return route.fulfill(response);
  });
}

test.describe("invalid world token recovery", () => {
  test("SPARQL explains how to recover from a missing API key", async ({
    page,
  }) => {
    const worldId = "invalid-sparql-token";
    await signIn(page);
    await mockApiResponse(page, `/worlds/${worldId}/sparql`, {
      status: 400,
      json: { error: { message: "Missing or invalid API key" } },
    });

    await page.goto(`/worlds/${worldId}/sparql`);
    await selectToken(page, worldId);
    await page.getByRole("button", { name: "Execute Query" }).click();
    const message = page.getByText("The selected token isn't recognized", {
      exact: false,
    });
    await expect(message).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Create a real token" }),
    ).toHaveAttribute("href", new RegExp(`/worlds/${worldId}/tokens/?$`));
  });

  test("Export explains how to recover from an unauthorized token", async ({
    page,
  }) => {
    const worldId = "invalid-export-token";
    await signIn(page);
    await mockApiResponse(page, `/worlds/${worldId}/export**`, {
      status: 403,
      json: { error: { message: "Forbidden" } },
    });

    await page.goto(`/worlds/${worldId}/export`);
    await selectToken(page, worldId);
    await page.getByText("Turtle", { exact: true }).click();

    const message = page.getByText("The selected token isn't recognized", {
      exact: false,
    });
    await expect(message).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Create a real token" }),
    ).toHaveAttribute("href", new RegExp(`/worlds/${worldId}/tokens/?$`));
  });

  test("unexpected Export errors keep the backend message", async ({
    page,
  }) => {
    const worldId = "backend-export-error";
    await signIn(page);
    await mockApiResponse(page, `/worlds/${worldId}/export**`, {
      status: 500,
      json: {
        error: { message: "The graph service is temporarily unavailable" },
      },
    });

    await page.goto(`/worlds/${worldId}/export`);
    await selectToken(page, worldId);
    await page.getByText("Turtle", { exact: true }).click();

    await expect(
      page.getByText("The graph service is temporarily unavailable", {
        exact: true,
      }),
    ).toBeVisible();
  });
});
