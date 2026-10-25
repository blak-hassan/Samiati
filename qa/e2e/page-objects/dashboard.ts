import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./base";

export class DashboardPage extends BasePage {
  readonly guestBanner: Locator;
  readonly signInButton: Locator;
  readonly discoverButton: Locator;
  readonly chatInput: Locator;
  readonly submitButton: Locator;
  readonly languageButton: Locator;
  readonly newChatButton: Locator;

  constructor(page: Page) {
    super(page);
    this.guestBanner = page.getByRole("banner").locator("text=/guest/i").first();
    this.signInButton = page.getByRole("button", { name: /sign in/i });
    this.discoverButton = page.getByRole("button", { name: /discover/i });
    this.chatInput = page.getByLabel("Search");
    this.submitButton = page.getByRole("button", { name: /Search/i });
    this.languageButton = page.getByRole("button", {
      name: /Swahili|Kikuyu|English|Luo|Kamba|Kalenjin|Luhya|Meru|Maasai/i,
    });
    this.newChatButton = page.getByRole("button", { name: /new chat/i });
  }

  async expectLoaded() {
    await this.waitForPageReady();
    // Either guest banner or chat UI should be present
    await expect(
      this.guestBanner.or(this.chatInput).or(this.signInButton)
    ).toBeVisible();
  }

  async isGuest() {
    return (await this.guestBanner.count()) > 0;
  }
}
