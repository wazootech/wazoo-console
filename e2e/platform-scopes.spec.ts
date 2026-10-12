import { expect, test } from "@playwright/test";
import {
  DEFAULT_PLATFORM_SCOPES,
  VALID_PLATFORM_SCOPES,
  parseScopes,
  validateScopes,
} from "../src/lib/platform-scopes";

// Pure logic checks; no browser or server needed.
test.describe("platform scopes", () => {
  test("worlds.admin is not selectable or a default (wazoo-api#103)", () => {
    const names = VALID_PLATFORM_SCOPES.map((s) => s.name);
    expect(names).not.toContain("worlds.admin");
    expect(DEFAULT_PLATFORM_SCOPES).not.toContain("worlds.admin");
    expect(VALID_PLATFORM_SCOPES.map((s) => s.label)).not.toContain(
      "Worlds (Admin)",
    );
  });

  test("a legacy worlds.admin scope parses and reports as unknown without throwing", () => {
    const legacy = "users.read worlds.admin";
    expect(parseScopes(legacy)).toEqual(["users.read", "worlds.admin"]);
    const result = validateScopes(legacy);
    expect(result.unknownTokens).toEqual(["worlds.admin"]);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain("worlds.admin");
  });
});
