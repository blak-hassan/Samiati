import { Page, expect } from "@playwright/test";

export class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path: string) {
    const gotoPath = (this.page as any).gotoPath ?? this.page.goto.bind(this.page);
    const response = await gotoPath(path, { waitUntil: "domcontentloaded" });
    return response;
  }

  async expectStatusOk(response: Response | null) {
    expect(response?.status()).toBeLessThan(400);
  }

  async waitForPageReady() {
    await expect(this.page.locator("body")).toBeVisible();
  }
}
