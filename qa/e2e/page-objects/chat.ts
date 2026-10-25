import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./base";

export class ChatPage extends BasePage {
  readonly input: Locator;
  readonly submit: Locator;
  readonly loadingIndicator: Locator;
  readonly errorMessage: Locator;
  readonly answerArea: Locator;
  readonly retryButton: Locator;
  readonly voiceButton: Locator;
  readonly languageButton: Locator;
  readonly welcomeHero: Locator;
  readonly thread: Locator;

  constructor(page: Page) {
    super(page);
    this.input = page.getByLabel("Search");
    this.submit = page.getByRole("button", { name: /Search/i });
    this.loadingIndicator = page.getByRole("status").or(
      page.locator('[aria-label="Search"] > .animate-spin, [aria-label="Search"] svg')
    );
    this.errorMessage = page.getByText(/error|sorry|still working/i);
    this.answerArea = page.locator('[role="log"], main').first();
    this.retryButton = page.getByRole("button", { name: /retry|tap to retry/i });
    this.voiceButton = page.getByRole("button", { name: /voice search/i });
    this.languageButton = page.getByRole("button", {
      name: /Swahili|Kikuyu|English|Luo|Kamba|Kalenjin|Luhya|Meru|Maasai/i,
    });
    this.welcomeHero = page.getByText(/speak or type the way you naturally do/i);
    this.thread = page.getByRole("log");
  }

  async expectWelcomeMode() {
    await this.waitForPageReady();
    await expect(this.welcomeHero.or(this.input)).toBeVisible();
  }

  async submitQuery(query: string) {
    await this.input.fill(query);
    await expect(this.submit).toBeEnabled();
    await this.submit.click();
  }

  async expectLoading() {
    await expect(this.input).toBeDisabled();
    // submit shows a loader while searching
    await expect(this.submit.locator("svg")).toBeVisible();
  }

  async expectAnswerRendered() {
    // Answer appears in the thread after search completes
    await expect(this.thread).toBeVisible();
  }

  async expectErrorShown() {
    await expect(this.errorMessage.first()).toBeVisible();
  }
}
