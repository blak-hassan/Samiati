import { test, expect } from "@playwright/test";

test.describe("Changa contribution flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/changa");
  });

  test("shows the revamped Changa home with greeting + language selector", async ({ page }) => {
    // Greeting header ("Hello, {name}") + prototype tagline.
    await expect(page.locator("h1").first()).toContainText("Hello,");
    await expect(page.getByText("Which language do you want to help?")).toBeVisible();
  });

  test("allows language selection", async ({ page }) => {
    await page.click("button:has-text('Kiswahili')");
    await expect(page.locator("button:has-text('Kiswahili')")).toHaveClass(/bg-amber-200/);
  });

  test("shows empty state for new contributors", async ({ page }) => {
    // In demo mode with no contributions, the empty state should appear
    await expect(page.locator("text=Claim your first task")).toBeVisible();
  });

  test("surfaces community + keeper entry points under today's goal", async ({ page }) => {
    await expect(page.getByText("Your language community")).toBeVisible();
    await expect(page.getByText("Open community")).toBeVisible();
    await expect(
      page.getByText("Be a keeper of your language").or(page.getByText("Trusted Reviewer")).first()
    ).toBeVisible();
  });

  test("opens the community page from the home card", async ({ page }) => {
    await page.getByText("Open community").click();
    await expect(page.getByText("Word of the day")).toBeVisible();
    await expect(page.getByText("Recognition")).toBeVisible();
    await expect(page.getByText("Where we need more voices")).toBeVisible();
  });

  test("displays campaign section when available", async ({ page }) => {
    // Wait for campaigns to load or show empty state
    await page.waitForTimeout(2000);
    const campaigns = page.locator("text=Today's missions").first();
    const emptyState = page.locator("text=Claim your first task").first();
    // Narrow the combined locator to a single match before asserting visibility.
    await expect(campaigns.or(emptyState)).toBeVisible();
  });
});
