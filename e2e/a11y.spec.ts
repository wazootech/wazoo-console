import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// WCAG 2.1 AA regression guard. Runs axe over the public routes with the
// serious/critical impact bar (the standard AA gate). Keep this list of
// scanned routes to pages reachable without authentication so it works
// against any deployed environment and in CI against a local build.
// Note: unauthenticated requests to other console routes are redirected
// straight to the WorkOS hosted page, so the sign-in gate is the only
// self-hosted page that is scannable pre-auth.
const PUBLIC_ROUTES = ["/sign-in"];

test.describe("a11y audit (WCAG 2.1 AA)", () => {
  for (const path of PUBLIC_ROUTES) {
    test(`${path} has no serious or critical axe violations`, async ({
      page,
    }) => {
      await page.goto(path);
      await page.waitForLoadState("domcontentloaded");
      // Give client components a beat to hydrate before scanning.
      await page.waitForTimeout(750);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const violations = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );

      expect(
        violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.length,
          help: v.help,
        })),
        JSON.stringify(
          violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            nodes: v.nodes.map((n) => n.target),
          })),
          null,
          2,
        ),
      ).toEqual([]);
    });
  }

  test("skip link is keyboard-reachable and jumps to main content", async ({
    page,
  }) => {
    await page.goto("/sign-in");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
  });
});
