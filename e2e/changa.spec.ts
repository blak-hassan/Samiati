import { test, expect } from "@playwright/test";

test.describe("Changa contribution flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/changa");
  });

  test("shows Changa home with language selector", async ({ page }) => {
    await expect(page.locator("h1")).toHaveText("Changa");
    await expect(page.locator("text=Help your language in seconds.")).toBeVisible();
  });

  test("allows language selection", async ({ page }) => {
    await page.click("button:has-text('Kiswahili')");
    await expect(page.locator("button:has-text('Kiswahili')")).toHaveClass(/bg-amber-200/);
  });

  test("shows empty state for new contributors", async ({ page }) => {
    // In demo mode with no contributions, the empty state should appear
    await expect(page.locator("text=Claim your first task")).toBeVisible();
  });

  test("displays campaign section when available", async ({ page }) => {
    // Wait for campaigns to load or show empty state
    await page.waitForTimeout(2000);
    const campaigns = page.locator("text=Active campaigns").first();
    const emptyState = page.locator("text=Claim your first task").first();
    // Narrow the combined locator to a single match before asserting visibility.
    await expect(campaigns.or(emptyState)).toBeVisible();
  });
});
