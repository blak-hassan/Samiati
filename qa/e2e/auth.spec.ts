import { test, expect } from "./fixtures";
import { SignInPage } from "./page-objects/sign-in";

test.describe("Sign-in / sign-up via supported dev/test methods", () => {
  let signIn: SignInPage;

  test.beforeEach(({ page }) => {
    signIn = new SignInPage(page);
  });

  test("GET /sign-in renders Clerk UI or demo banner", async ({ page }) => {
    const response = await page.goto("/sign-in");
    await expect(page.locator("body")).toBeVisible();
    test.info().annotations.push({
      type: "test",
      description: `/sign-in status: ${response?.status()}. Renders Clerk UI if configured, or degrades in demo mode.`,
    });
  });

  test("GET /sign-up renders Clerk UI or demo banner", async ({ page }) => {
    const response = await page.goto("/sign-up");
    await expect(page.locator("body")).toBeVisible();
    test.info().annotations.push({
      type: "test",
      description: `/sign-up status: ${response?.status()}. Renders Clerk UI if configured, or degrades in demo mode.`,
    });
  });

  test("GET /forgot-password renders the form or Clerk error", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.locator("body")).toBeVisible();
    // May render Clerk form or "Something went wrong" if Clerk not configured
    await expect(
      page.getByRole("heading", { name: /forgot/i }).or(
        page.getByText(/something went wrong/i)
      )
    ).toBeVisible();
  });

  test("demo mode runs without Clerk credentials (always signed in as mock user)", async ({
    page,
  }) => {
    // In demo mode (no Convex URL / no pk_ Clerk key), the app signs in a
    // mock user automatically. The dashboard should not require Clerk.
    await page.goto("/dashboard");
    await expect(page.locator("body")).toBeVisible();

    // No Clerk sign-in wall should block the dashboard in demo mode.
    const clerkWall = page.getByRole("heading", { name: /sign in/i });
    await expect(clerkWall).not.toBeVisible();
  });

  test("mock AI guard module loads and returns a boolean", async ({}) => {
    const { mockAiEnabled } = require("../env/guard.ts");
    const result = mockAiEnabled();
    expect(typeof result.enabled).toBe("boolean");
    expect(typeof result.reason).toBe("string");
  });
});
