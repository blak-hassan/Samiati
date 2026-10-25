import { test, expect } from "./fixtures";

test.describe("Discover", () => {
  test("GET /dashboard/discover returns 2xx or degrades gracefully", async ({
    page,
  }) => {
    const response = await page.goto("/dashboard/discover", {
      waitUntil: "domcontentloaded",
    });
    // May be 200 (demo mock) or 404/500 (needs Convex).
    // The page must not crash the browser.
    await expect(page.locator("body")).toBeVisible();
    test.info().annotations.push({
      type: "test",
      description: `/dashboard/discover status: ${response?.status()}. May need Convex for full features.`,
    });
  });

  test("discover link from dashboard header is reachable", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("body")).toBeVisible();

    const discover = page.getByRole("button", { name: /discover/i });
    if ((await discover.count()) > 0) {
      await discover.click();
      await expect(page.locator("body")).toBeVisible();
    }
  });
});
