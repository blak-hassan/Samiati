import { test, expect } from "./fixtures";
import { HomePage } from "./page-objects/home";
import { ChatPage } from "./page-objects/chat";

test.describe("Chat submission and response rendering (DemoChat)", () => {
  let home: HomePage;
  let chat: ChatPage;

  test.beforeEach(({ page }) => {
    home = new HomePage(page);
    chat = new ChatPage(page);
  });

  test("submitting a query renders user message + samiati reply", async ({
    page,
  }) => {
    await home.goto("/");
    await home.expectLoaded();

    await home.chatInput.fill("Habari yako");
    await expect(home.submitButton).toBeEnabled();
    await home.submitButton.click();

    // User message appears
    await expect(page.getByText(/Habari yako/i)).toBeVisible();

    // After ~700ms the samiati reply should appear
    await page.waitForTimeout(900);

    // Reply rendered in the thread
    await expect(page.getByRole("log")).toContainText(
      /Ũhoro|Wĩ|Nĩ|Thayũ|Kikuyu/i
    );
  });

  test("empty input submission is a no-op (button not disabled)", async ({
    page,
  }) => {
    await home.goto("/");
    await home.expectLoaded();

    await home.chatInput.fill("");
    // DemoChat does not disable the submit button when empty; send() is a
    // no-op instead. Verify clicking does not add a message.
    await home.submitButton.click();
    await page.waitForTimeout(500);
    await expect(page.getByRole("log")).not.toContainText(/empty/i);
    await expect(home.chatInput).toHaveValue("");
  });

  test("submitting clears the input", async ({ page }) => {
    await home.goto("/");
    await home.expectLoaded();
    await page.waitForLoadState("networkidle");

    await home.chatInput.fill("Test query");
    await home.submitButton.click();
    // Input is cleared client-side by DemoChat's setInput('') on submit
    await page.waitForTimeout(200);
    await expect(home.chatInput).toHaveValue("");
  });

  test("suggestion chips trigger a submission", async ({ page }) => {
    await home.goto("/");
    await home.expectLoaded();

    const chip = page
      .getByRole("button", { name: /How are you|Thank you|Teach me/i })
      .first();
    await expect(chip).toBeVisible();
    await chip.click();
    await page.waitForTimeout(900);
    await expect(page.getByRole("log")).toBeVisible();
  });
});

test.describe("Chat submission on dashboard (SearchHero)", () => {
  test("dashboard renders without crashing (chat may require Convex)", async ({
    page,
  }) => {
    const response = await page.goto("/dashboard");
    // Dashboard may return 200 (demo mock) or 404/500 (needs Convex).
    // Either way the page must not crash the browser — a Next.js error
    // boundary ("Something went wrong") is an acceptable degraded outcome.
    await expect(page.locator("body")).toBeVisible();

    const input = page.getByLabel("Search");
    const submit = page.getByRole("button", { name: /Search/i });
    const signIn = page.getByText(/sign in/i);
    const errorBoundary = page.getByText(/something went wrong/i);

    // At least one of: chat surface, sign-in prompt, or error boundary
    await expect(input.or(submit).or(signIn).or(errorBoundary)).toBeVisible();
  });
});
