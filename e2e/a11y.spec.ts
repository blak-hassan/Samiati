import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility", () => {
  test("homepage has no critical or serious a11y violations", async ({ page }) => {
    await page.goto("/");
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    const seriousViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(seriousViolations).toEqual([]);
  });

  test("dashboard has skip navigation link", async ({ page }) => {
    await page.goto("/dashboard");
    const skipLink = page.locator('a[href="#main"]');
    await expect(skipLink).toBeAttached();

    // Exercise keyboard navigation: focus the link, activate it, and verify
    // focus actually moves to the primary #main landmark.
    await skipLink.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main")).toBeFocused();
  });

  test("Changa home has accessible live regions", async ({ page }) => {
    await page.goto("/dashboard/changa");
    // Scope to Changa's own status region (not any page-wide aria-live region)
    // and assert it surfaces a status update.
    const liveRegion = page.locator("main [aria-live='polite']").first();
    await expect(liveRegion).toBeAttached();
    await expect(liveRegion).not.toBeEmpty();
  });
});
