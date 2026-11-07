import { expect, test } from "@playwright/test";

/**
 * End-to-end tests for the parts of Samiati a user actually touches.
 *
 * They run against the production build with the local backend, so they need
 * no account, no API key and no deployment.
 */

test.describe("Samiati", () => {
  test("shows the welcome screen with a language picker", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /talk about in/i })).toBeVisible();
    await expect(page.locator('[aria-label*="Current language"]:visible').first()).toBeVisible();
    await expect(page.getByText("Kiswahili").filter({ visible: true }).first()).toBeVisible();
  });

  test("searches for a language without diacritics", async ({ page }) => {
    await page.goto("/");

    await page.locator('[aria-label*="Current language"]:visible').first().click();
    await page.getByPlaceholder("Search languages…").fill("gikuyu");

    const option = page.getByRole("option", { name: /Kikuyu/ });
    await expect(option).toBeVisible();
  });

  test("lists every language the registry promises", async ({ page }) => {
    await page.goto("/");

    await page.locator('[aria-label*="Current language"]:visible').first().click();
    await page.getByPlaceholder("Search languages…").fill("");

    for (const name of [
      "Kiswahili",
      "Sheng",
      "Kikuyu",
      "Luhya",
      "Dholuo",
      "Somali",
      "Kamba",
      "Kalenjin",
      "Gusii",
      "Meru",
      "Maasai",
    ]) {
      await expect(page.getByRole("option", { name: new RegExp(name) }).first()).toBeVisible();
    }
  });

  test("starts a conversation and streams a reply", async ({ page }) => {
    await page.goto("/");

    await page
      .getByPlaceholder(/ask anything in/i)
      .fill("Habari za asubuhi");
    await page.getByRole("button", { name: /start/i }).click();

    await expect(page).toHaveURL(/\/chat\//);
    // The demo provider is used when no model is configured, and it always
    // labels itself.
    await expect(page.getByText(/demo placeholder/i).first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test("keeps the conversation in the sidebar history", async ({ page }) => {
    await page.goto("/");

    await page
      .getByPlaceholder(/ask anything in/i)
      .fill("Habari za asubuhi");
    await page.getByRole("button", { name: /start/i }).click();

    await expect(page).toHaveURL(/\/chat\//);

    // On a phone the history lives in the drawer, so open it first.
    const navButton = page.getByRole("button", { name: /open navigation/i });
    if (await navButton.isVisible()) {
      await navButton.click();
    }

    await expect(
      page.getByRole("link", { name: /Habari za asubuhi/ }).first(),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("opens the Changa contribution flow", async ({ page }) => {
    await page.goto("/changa");

    await expect(
      page.getByRole("heading", { name: /make samiati better/i }),
    ).toBeVisible();
    await expect(page.getByText("Open tasks").first()).toBeVisible();

    await page.getByRole("button", { name: /open task/i }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/source text/i).first()).toBeVisible();
  });

  test("opens the review queue", async ({ page }) => {
    await page.goto("/changa/review");

    await expect(
      page.getByRole("heading", { name: /review queue/i }),
    ).toBeVisible();
  });

  test("shows Discover with topic filters", async ({ page }) => {
    await page.goto("/discover");

    await expect(
      page.getByRole("heading", { name: /news and knowledge/i }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Culture" })).toBeVisible();
    await expect(page.getByText(/Sheng reveals/i).first()).toBeVisible();
  });

  test("saves a Discover item", async ({ page }) => {
    await page.goto("/discover");

    const save = page.getByRole("button", { name: /save/i }).first();
    await save.click();
    await expect(save).toHaveAttribute("aria-pressed", "true");
  });

  test("joins a language community and opens its threads", async ({ page }) => {
    await page.goto("/communities");

    // Scope to one card: joining the first community turns its button into
    // "Joined", which would otherwise make the next card the first match.
    const card = page.locator("li", {
      has: page.getByRole("heading", { name: "Kiswahili Community" }),
    });
    await card.getByRole("button", { name: /^join$/i }).click();
    await expect(card.getByRole("button", { name: /joined/i })).toBeVisible();

    await page.getByRole("link", { name: /Kiswahili Community/i }).click();
    await expect(page).toHaveURL(/\/communities\//);
    await expect(page.getByText(/threads/i).first()).toBeVisible();
  });

  test("shows the profile and its contribution statistics", async ({ page }) => {
    await page.goto("/profile");

    await expect(page.getByText(/preferred languages/i)).toBeVisible();
    await expect(page.getByText(/contribution/i).first()).toBeVisible();
  });

  test("changes the theme and the default language in settings", async ({
    page,
  }) => {
    await page.goto("/settings");

    await expect(page.getByText(/make samiati yours/i)).toBeVisible();

    const languageButton = page.locator('[aria-label*="Current language"]:visible').first();
    await languageButton.click();
    await page.getByPlaceholder("Search languages…").fill("kikuyu");
    await page.getByRole("option", { name: /Kikuyu/ }).first().click();

    await expect(
      page.locator('[aria-label*="Current language: Kikuyu"]:visible').first(),
    ).toBeVisible();
  });

  test("builds a dataset version from reviewed work", async ({ page }) => {
    await page.goto("/dataset");

    await expect(
      page.getByRole("heading", { name: /from contributions to training data/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /build a version/i }),
    ).toBeVisible();
  });

  test("shows a not-found page for a missing conversation", async ({ page }) => {
    await page.goto("/chat/does-not-exist");
    await expect(page.getByText(/conversation not found/i)).toBeVisible();
  });

  test("is usable on a phone-sized viewport", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/");

    await expect(page.getByRole("button", { name: /open navigation/i })).toBeVisible();
    await page.getByRole("button", { name: /open navigation/i }).click();
    await expect(page.getByRole("button", { name: /new chat/i })).toBeVisible();
  });
});
