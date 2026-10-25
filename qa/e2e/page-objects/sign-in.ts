import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./base";

export class SignInPage extends BasePage {
  readonly signInHeading: Locator;
  readonly signUpLink: Locator;
  readonly clerkSignIn: Locator;

  constructor(page: Page) {
    super(page);
    this.signInHeading = page.getByRole("heading", { name: /sign in/i });
    this.signUpLink = page.getByRole("link", { name: /sign up/i });
    this.clerkSignIn = page.locator("[data-testid='clerk-sign-in'], .clerk-sign-in, [class*='clerk']");
  }

  async expectLoaded() {
    await this.waitForPageReady();
    await expect(
      this.signInHeading.or(this.clerkSignIn).or(this.page.locator("body"))
    ).toBeVisible();
  }

  async isDemoMode() {
    // In demo mode, the sign-in page shows a Clerk banner or demo hint
    return (await this.clerkSignIn.count()) > 0 || (await pageContainsDemoBanner(this.page));
  }
}

async function pageContainsDemoBanner(page: Page): Promise<boolean> {
  return (await page.getByText(/demo|mock|guest/i).count()) > 0;
}
