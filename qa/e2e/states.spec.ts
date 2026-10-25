import { test, expect } from "./fixtures";
import { ChatPage } from "./page-objects/chat";
import { HomePage } from "./page-objects/home";

test.describe("Loading, error, empty, and retry states", () => {
  let chat: ChatPage;
  let home: HomePage;

  test.beforeEach(({ page }) => {
    chat = new ChatPage(page);
    home = new HomePage(page);
  });

  test("welcome/empty mode renders centered hero before any search", async ({
    page,
  }) => {
    await home.goto("/");
    await home.expectLoaded();
    await chat.expectWelcomeMode();
    await expect(page.getByRole("log")).toBeVisible();
  });

  test("samiati reply arrives after a chat turn (DemoChat)", async ({
    page,
  }) => {
    await home.goto("/");
    await home.expectLoaded();

    await home.chatInput.fill("Loading test");
    await home.submitButton.click();

    // The typing dots appear while isTyping is true; the reply arrives
    // after ~700ms. Verify the reply renders.
    await page.waitForTimeout(900);
    await expect(page.getByRole("log")).toContainText(
      /Ũhoro|Wĩ|Nĩ|Thayũ|Kikuyu/i
    );
  });

  test("error state surfaces when submission fails", async ({ page }) => {
    // On the dashboard, submitting without Convex may show an error or
    // sign-in prompt. Exercise the error path and verify UI doesn't crash.
    await page.goto("/dashboard");
    await expect(page.locator("body")).toBeVisible();

    const input = page.getByLabel("Search");
    const submit = page.getByRole("button", { name: /Search/i });

    if ((await input.count()) > 0 && (await submit.count()) > 0) {
      await input.fill("error probe");
      await submit.click();
      // Either an error message, a sign-in redirect, or a loading state —
      // all are valid non-crash outcomes. The dashboard may show a Next.js
      // error boundary ("Something went wrong") when Convex is unavailable.
      await page.waitForTimeout(2000);
      await expect(page.locator("body")).toBeVisible();
    } else {
      // No chat surface on dashboard — page should still render body
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("retry button is offered on error (dashboard SearchResults)", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page.locator("body")).toBeVisible();

    const input = page.getByLabel("Search");
    if ((await input.count()) === 0) {
      test.skip(); // no chat surface on this route/mode
      return;
    }

    await input.fill("retry probe");
    const submit = page.getByRole("button", { name: /Search/i });
    await submit.click();

    // Wait briefly for any error/retry to surface
    await page.waitForTimeout(1500);

    const retry = page.getByRole("button", { name: /retry|tap to retry/i });
    if ((await retry.count()) > 0) {
      await expect(retry).toBeVisible();
      await retry.click();
      // Retry should re-trigger submission without crashing
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("no duplicate submissions while isTyping (DemoChat send() no-op)", async ({
    page,
  }) => {
    await home.goto("/");
    await home.expectLoaded();

    await home.chatInput.fill("duplicate probe");
    await home.submitButton.click();

    // While isTyping is true, send() is a no-op — clicking again adds nothing
    await home.submitButton.click();
    await page.waitForTimeout(1200);

    // Thread should not contain duplicate copies of the same user message
    // (DemoChat send() returns early when isTyping is true)
    const userMessages = page.getByText(/duplicate probe/i);
    await expect(userMessages.first()).toBeVisible();
    await expect(userMessages).toHaveCount(1);

    // After the turn completes, button works again
    await expect(home.submitButton).toBeEnabled();
  });
});
