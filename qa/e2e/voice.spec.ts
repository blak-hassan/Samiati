import { test, expect } from "./fixtures";

test.describe("Voice controls", () => {
  test("DemoChat voice mode button renders (Web Speech API may be unavailable)", async ({
    page,
  }) => {
    // Grant microphone permission (may be denied by the browser in headless;
    // the app degrades gracefully).
    await page.context().grantPermissions(["microphone"]);

    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();

    // Wait for DemoChat hydration — the mode picker (Type/Voice) buttons
    await expect(page.getByRole("button", { name: /Type/i }).first()).toBeVisible({
      timeout: 10_000,
    });

    const voiceModeBtn = page.getByRole("button", { name: /Voice/i }).first();
    await expect(voiceModeBtn).toBeVisible();
    await voiceModeBtn.click();

    // After switching to voice mode, either the "Start voice input" button
    // appears, or a fallback note (Web Speech unsupported in headless Chrome).
    await expect(
      page
        .getByRole("button", { name: /Start voice input/i })
        .first()
        .or(
          page.getByRole("status", { name: /Speak Kikuyu|Speak Kiswahili/i })
        )
    ).toBeVisible({ timeout: 5_000 });
  });

  test("voice permission grant does not crash the page", async ({ page }) => {
    await page.context().grantPermissions(["microphone"]);
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("button", { name: /Send message/i })).toBeVisible();
  });
});
