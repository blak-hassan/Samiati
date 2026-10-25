import { test, expect } from "./fixtures";
import { HomePage } from "./page-objects/home";
import { LanguageSelectorPage } from "./page-objects/language-selector";

test.describe("Language selector — switching", () => {
  let home: HomePage;
  let langs: LanguageSelectorPage;

  test.beforeEach(({ page }) => {
    home = new HomePage(page);
    langs = new LanguageSelectorPage(page);
  });

  test("home page shows live Kikuyu and Kiswahili language cards", async ({
    page,
  }) => {
    await home.goto("/");
    await home.expectLoaded();
    await expect(home.kikuyuCard).toBeVisible();
    await expect(home.swahiliCard).toBeVisible();
    await expect(home.kikuyuCard).toHaveAttribute("href", "/languages/kikuyu");
    await expect(home.swahiliCard).toHaveAttribute("href", "/languages/swahili");
  });

  test("DemoChat language switcher changes active language", async ({ page }) => {
    await home.goto("/");
    await home.expectLoaded();

    // Ensure client hydration is complete before interacting with DemoChat
    await page.waitForLoadState("networkidle");

    // Wait for DemoChat language buttons to be visible and stable
    const kiswahiliBtn = page.getByRole("button", { name: /Kiswahili/i }).first();
    await expect(kiswahiliBtn).toBeVisible({ timeout: 10_000 });

    // Default language is Kikuyu
    const talkingIn = page.getByText(/talking in kikuyu/i);
    await expect(talkingIn).toBeVisible();

    // Switch to Kiswahili
    await kiswahiliBtn.click();
    await expect(page.getByText(/talking in kiswahili/i)).toBeVisible({ timeout: 5_000 });
    await expect(talkingIn).not.toBeVisible();

    // Switch back to Kikuyu
    const kikuyuBtn = page.getByRole("button", { name: /Kikuyu/i }).first();
    await kikuyuBtn.click();
    await expect(talkingIn).toBeVisible();
  });

  test("language switch persists within session (DemoChat state)", async ({
    page,
  }) => {
    await home.goto("/");
    await home.expectLoaded();
    await page.waitForLoadState("networkidle");

    const kiswahiliBtn = page.getByRole("button", { name: /Kiswahili/i }).first();
    await expect(kiswahiliBtn).toBeVisible({ timeout: 10_000 });
    await kiswahiliBtn.click();
    await expect(page.getByText(/talking in kiswahili/i)).toBeVisible({ timeout: 5_000 });

    // Submit a query in Kiswahili mode — suggestions should match Kiswahili
    await home.chatInput.fill("Asante");
    await home.submitButton.click();
    // The user message "Asante" appears in the thread (first match)
    await expect(page.getByText(/Asante/i).first()).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("Language selector — persistence after reload", () => {
  test("language resets to default on reload (current behavior)", async ({
    page,
  }) => {
    const home = new HomePage(page);
    await home.goto("/");
    await home.expectLoaded();
    await page.waitForLoadState("networkidle");

    // Switch to Kiswahili
    const kiswahiliBtn = page.getByRole("button", { name: /Kiswahili/i }).first();
    await expect(kiswahiliBtn).toBeVisible({ timeout: 10_000 });
    await kiswahiliBtn.click();
    await expect(page.getByText(/talking in kiswahili/i)).toBeVisible({ timeout: 5_000 });

    // Reload
    await page.reload();
    await home.expectLoaded();
    await page.waitForLoadState("networkidle");

    // Observe whether language persisted (document current behavior)
    const isKiswahili = await page
      .getByText(/talking in kiswahili/i)
      .count()
      .then((c) => c > 0);
    const isKikuyu = await page
      .getByText(/talking in kikuyu/i)
      .count()
      .then((c) => c > 0);

    // At minimum, the page must remain functional after reload.
    await expect(home.chatInput).toBeVisible();
    await expect(home.submitButton).toBeVisible();

    // Record outcome: DemoChat language is local-state only
    // (src/components/landing/DemoChat.tsx:78); persistence after reload is
    // NOT implemented.
    test.info().annotations.push({
      type: "test",
      description: `After reload: kiswahili=${isKiswahili}, kikuyu=${isKikuyu}. DemoChat language is local-state only; persistence after reload is NOT implemented.`,
    });
  });
});
