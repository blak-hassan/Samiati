import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./base";

export class HomePage extends BasePage {
  readonly heading: Locator;
  readonly announcement: Locator;
  readonly kikuyuCard: Locator;
  readonly swahiliCard: Locator;
  readonly chatInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", {
      name: /AI that speaks Kikuyu your language/i,
    });
    this.announcement = page.getByText(/Kikuyu and Kiswahili are live/i);
    this.kikuyuCard = page.getByRole("link", { name: /Kikuyu/i }).first();
    this.swahiliCard = page.getByRole("link", { name: /Swahili/i }).first();
    this.chatInput = page.getByLabel("Ask Samiati a question");
    this.submitButton = page.getByLabel("Send message");
  }

  async expectLoaded() {
    await this.waitForPageReady();
    await expect(this.heading).toBeVisible();
    await expect(this.announcement).toBeVisible();
    await expect(this.kikuyuCard).toBeVisible();
    await expect(this.swahiliCard).toBeVisible();
    await expect(this.chatInput).toBeVisible();
  }

  async goToLanguage(slug: "kikuyu" | "swahili") {
    await this.page.goto(`/languages/${slug}`);
    await this.waitForPageReady();
  }
}
