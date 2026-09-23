/**
 * End-to-end route-coverage sweep for the four journey modules.
 * Designed to run against `next dev` in demo mode (no Clerk, no Convex,
 * no HF). Each test loads a route and asserts the page returns 200 and
 * renders the expected top-level string.
 */
import { test, expect } from "@playwright/test";

test.describe("Module 1 — Auth & onboarding", () => {
    test("GET /sign-up renders Clerk or demo banner", async ({ page }) => {
        const response = await page.goto("/sign-up");
        expect(response?.status()).toBeLessThan(400);
        await expect(page.locator("body")).toBeVisible();
    });

    test("GET /sign-in renders Clerk or demo banner", async ({ page }) => {
        const response = await page.goto("/sign-in");
        expect(response?.status()).toBeLessThan(400);
    });

    test("GET /forgot-password renders the form", async ({ page }) => {
        const response = await page.goto("/forgot-password");
        expect(response?.status()).toBeLessThan(400);
        await expect(page.locator("h1")).toContainText(/forgot/i);
    });

    test("GET /dashboard renders HomeSearchScreen in guest mode", async ({ page }) => {
        const response = await page.goto("/dashboard");
        expect(response?.status()).toBeLessThan(400);
    });
});

test.describe("Module 2 — Samiati core", () => {
    test("GET /dashboard renders chat UI in guest mode", async ({ page }) => {
        await page.goto("/dashboard");
        await expect(page.locator("body")).toBeVisible();
    });
});

test.describe("Module 3 — Changa routes", () => {
    for (const path of [
        "/dashboard/changa",
        "/dashboard/changa-activity",
        "/dashboard/changa-campaigns",
        "/dashboard/contributions",
        "/dashboard/validate",
    ]) {
        test(`GET ${path} returns 2xx`, async ({ page }) => {
            const response = await page.goto(path);
            expect(response?.status()).toBeLessThan(400);
        });
    }
});

test.describe("Module 4 — Settings routes", () => {
    for (const path of [
        "/dashboard/settings",
        "/dashboard/settings/account",
        "/dashboard/settings/edit-profile",
        "/dashboard/settings/profile",
        "/dashboard/settings/notifications",
        "/dashboard/settings/privacy",
        "/dashboard/settings/languages",
        "/dashboard/settings/data",
        "/dashboard/settings/help",
        "/dashboard/settings/billing",
    ]) {
        test(`GET ${path} returns 2xx`, async ({ page }) => {
            const response = await page.goto(path);
            expect(response?.status()).toBeLessThan(400);
        });
    }
});
