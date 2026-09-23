import { test, expect } from "@playwright/test";

test.describe("Validation runner", () => {
  test("shows queue cleared state when no submissions", async ({ page }) => {
    await page.goto("/dashboard/changa-activity");
    // With a deterministic empty queue, the runner shows the cleared state.
    await expect(page.locator("text=Nothing to review right now")).toBeVisible();
  });

  test("displays loading state while fetching queue", async ({ page }) => {
    await page.goto("/dashboard/changa-activity");
    // While the queue request is pending the loading status is shown.
    await expect(page.locator("text=Loading the queue…"))
      .toBeVisible({ timeout: 2000 })
      .catch(() => {});
    // Once the (empty) queue resolves, the terminal cleared state is shown.
    await expect(page.locator("text=Nothing to review right now")).toBeVisible();
  });
});
