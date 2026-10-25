import { test, expect } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility smoke checks (axe-core)", () => {
  test("homepage has no critical a11y violations", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page }).analyze();
    const critical = results.violations.filter((v) => v.impact === "critical");
    const serious = results.violations.filter((v) => v.impact === "serious");
    test.info().annotations.push({
      type: "test",
      description: `Homepage: ${serious.length} serious, ${critical.length} critical axe violations`,
    });
    expect(critical).toEqual([]);
  });

  test("dashboard has no critical a11y violations", async ({ page }) => {
    await page.goto("/dashboard");
    const results = await new AxeBuilder({ page }).analyze();
    const critical = results.violations.filter((v) => v.impact === "critical");
    const serious = results.violations.filter((v) => v.impact === "serious");
    test.info().annotations.push({
      type: "test",
      description: `Dashboard: ${serious.length} serious, ${critical.length} critical axe violations`,
    });
    expect(critical).toEqual([]);
  });

  test("about page has no critical a11y violations", async ({ page }) => {
    await page.goto("/about");
    const results = await new AxeBuilder({ page }).analyze();
    const critical = results.violations.filter((v) => v.impact === "critical");
    const serious = results.violations.filter((v) => v.impact === "serious");
    test.info().annotations.push({
      type: "test",
      description: `About: ${serious.length} serious, ${critical.length} critical axe violations`,
    });
    expect(critical).toEqual([]);
  });

  test("skip-to-content link moves focus to #main", async ({ page }) => {
    await page.goto("/");
    const skipLink = page.locator('a[href="#main"]');
    await expect(skipLink).toBeAttached();
    await skipLink.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main")).toBeFocused();
  });
});
