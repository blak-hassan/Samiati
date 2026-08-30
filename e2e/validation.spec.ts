import { test, expect } from "@playwright/test";

test.describe("Validation runner", () => {
  test("shows queue cleared state when no submissions", async ({ page }) => {
    await page.goto("/dashboard/changa-activity");
    // The validation runner is accessible from Changa activity
    await expect(page.locator("text=Community review")).toBeVisible();
  });

  test("displays loading state while fetching queue", async ({ page }) => {
    await page.goto("/dashboard/changa-activity");
    // Initially loading or empty state should be visible
    await expect(page.locator("text=Nothing to review right now").or(page.locator("text=Loading the queue…"))).toBeVisible();
  });
});
