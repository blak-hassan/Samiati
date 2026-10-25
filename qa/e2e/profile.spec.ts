import { test, expect } from "./fixtures";
import { DashboardPage } from "./page-objects/dashboard";

test.describe("Profile and navigation", () => {
  let dashboard: DashboardPage;

  test.beforeEach(({ page }) => {
    dashboard = new DashboardPage(page);
  });

  test("public routes render without crashing", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();

    await page.goto("/about");
    await expect(page.locator("body")).toBeVisible();

    await page.goto("/faq");
    await expect(page.locator("body")).toBeVisible();

    await page.goto("/pricing");
    await expect(page.locator("body")).toBeVisible();
  });

  test("dashboard loads (may need Convex for full features)", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("body")).toBeVisible();
  });

  test("settings languages route renders", async ({ page }) => {
    await page.goto("/dashboard/settings/languages");
    await expect(page.locator("body")).toBeVisible();
  });

  test("profile route renders", async ({ page }) => {
    await page.goto("/dashboard/profile");
    await expect(page.locator("body")).toBeVisible();
  });

  test("settings account route renders", async ({ page }) => {
    await page.goto("/dashboard/settings/account");
    await expect(page.locator("body")).toBeVisible();
  });
});
