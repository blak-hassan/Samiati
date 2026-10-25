import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./base";

export class AppNav extends BasePage {
  readonly sidebarToggle: Locator;
  readonly bottomTabBar: Locator;
  readonly navLink: (label: string) => Locator;

  constructor(page: Page) {
    super(page);
    this.sidebarToggle = page.getByRole("button", { name: /toggle navigation/i });
    this.bottomTabBar = page.locator("[role='navigation'], nav").last();
    this.navLink = (label: string) =>
      page.getByRole("link", { name: new RegExp(label, "i") }).first();
  }

  async openSidebar() {
    await this.sidebarToggle.click();
  }

  async clickNavLink(label: string) {
    await this.navLink(label).click();
  }
}
