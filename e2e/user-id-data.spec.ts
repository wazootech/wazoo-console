import { createServer, type Server } from "node:http";
import { expect, test, type Page } from "@playwright/test";

const USER_ID = "usr_e2e_export_account";
const CONFIRMATION_TOKEN = "confirm-e2e-account-deletion";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4101";
const API_PORT = Number(new URL(API_BASE_URL).port || 80);
const CONSOLE_HOST = new URL(
  process.env.BASE_URL ?? "https://console.wazoo.dev",
).hostname;

test.skip(
  !["localhost", "127.0.0.1"].includes(CONSOLE_HOST),
  "This contract fixture requires the local console and local API server.",
);

let server: Server;
let deletedAccountBody: { confirmationToken?: string } | null = null;

function respondJson(
  response: import("node:http").ServerResponse,
  status: number,
  body: unknown,
) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

test.beforeAll(async () => {
  server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", API_BASE_URL);
    if (request.method === "GET" && url.pathname === "/health") {
      return respondJson(response, 200, { status: "ok" });
    }
    if (request.method === "GET" && url.pathname === "/v1/users/me") {
      return respondJson(response, 200, {
        user: {
          userId: USER_ID,
          email: "account-id-e2e@example.com",
          displayName: "Account ID E2E",
          state: "ACTIVE",
          createTime: "2026-01-01T00:00:00Z",
        },
      });
    }
    if (request.method === "GET" && url.pathname === "/v1/users/me/export") {
      return respondJson(response, 200, {
        user: { userId: USER_ID },
        worlds: [{ worldId: "w_exported_world" }],
        apiTokens: [{ tokenId: "pt_exported_token" }],
        usageEvents: [{ eventId: "evt_exported_usage" }],
      });
    }
    if (request.method === "POST" && url.pathname === "/v1/users/me/deletion") {
      return respondJson(response, 201, {
        deletion: {
          deletionId: "del_e2e_account",
          expiresAt: "2026-01-01T00:15:00Z",
        },
        confirmationToken: CONFIRMATION_TOKEN,
        message: "Confirm the account deletion.",
      });
    }
    if (request.method === "DELETE" && url.pathname === "/v1/users/me") {
      let body = "";
      request.setEncoding("utf8");
      request.on("data", (chunk: string) => (body += chunk));
      request.on("end", () => {
        deletedAccountBody = JSON.parse(body);
        response.writeHead(204);
        response.end();
      });
      return;
    }
    return respondJson(response, 404, { error: { message: "Not found" } });
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(API_PORT, "127.0.0.1", resolve);
  });
});

test.afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

test("account export and deletion use explicit identifiers", async ({
  page,
}) => {
  const baseURL = test.info().project.use.baseURL;
  if (!baseURL) throw new Error("baseURL is required for this spec");
  await page.context().addCookies([
    {
      name: "wazoo_console_token",
      value: "e2e-platform-token",
      url: baseURL,
    },
  ]);

  await page.route("**/sign-out**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "signed out",
    }),
  );

  await page.goto("/settings");
  await expect(page.getByText(USER_ID, { exact: true })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export my data" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(`wazoo-data-${USER_ID}.json`);
  const exportStream = await download.createReadStream();
  if (!exportStream) throw new Error("Expected an account export download");
  let exportBody = "";
  for await (const chunk of exportStream) exportBody += chunk.toString();
  expect(JSON.parse(exportBody)).toMatchObject({
    user: { userId: USER_ID },
    worlds: [{ worldId: "w_exported_world" }],
    apiTokens: [{ tokenId: "pt_exported_token" }],
    usageEvents: [{ eventId: "evt_exported_usage" }],
  });

  await page.getByRole("button", { name: "Delete account" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(
    page.getByRole("heading", { name: "Confirm deletion" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Permanently delete account" })
    .click();
  await expect(page).toHaveURL(/\/sign-out\/?$/);
  expect(deletedAccountBody).toEqual({ confirmationToken: CONFIRMATION_TOKEN });
});
