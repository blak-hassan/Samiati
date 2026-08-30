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
  });

  test("Changa home has accessible live regions", async ({ page }) => {
    await page.goto("/dashboard/changa");
    const liveRegions = page.locator("[aria-live='polite']");
    await expect(liveRegions.first()).toBeAttached();
  });
});
