import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./base";

export class LanguageSelectorPage extends BasePage {
  readonly trigger: Locator;
  readonly popover: Locator;
  readonly searchInput: Locator;
  readonly languageOption: (name: string) => Locator;

  constructor(page: Page) {
    super(page);
    this.trigger = page.getByRole("button", {
      name: /Swahili|Kikuyu|English|Luo|Kamba|Kalenjin|Luhya|Meru|Maasai/i,
    });
    this.popover = page.getByRole("popover");
    this.searchInput = page.getByPlaceholder(/search languages/i);
    this.languageOption = (name: string) =>
      page.getByRole("button", { name: new RegExp(name, "i") }).first();
  }

  async open() {
    await this.trigger.click();
    await expect(this.popover).toBeVisible();
  }

  async select(name: string) {
    await this.open();
    await this.languageOption(name).click();
    await expect(this.popover).not.toBeVisible();
  }

  async expectTriggerShows(name: string) {
    await expect(this.trigger).toContainText(name);
  }
}
