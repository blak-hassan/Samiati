import { test as base, type Page } from "@playwright/test";
import { chromium } from "playwright";

export const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

/**
 * Custom `page` fixture that launches the local system Chrome (free, local)
 * via `chromium.launch({ executablePath })`. This avoids Playwright's bundled
 * Chromium, which is not downloaded in this environment (no access to
 * Google's Chrome-for-Testing storage).
 *
 * The built-in `page` fixture is overridden so Playwright never attempts to
 * launch its own bundled browser. baseURL is applied manually in `gotoPath`.
 */
export const test = base.extend<{ page: Page }>({
  page: async ({}, use) => {
    const executablePath =
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
    const browser = await chromium.launch({ executablePath, headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    // Apply baseURL to relative goto calls.
    const origGoto = page.goto.bind(page);
    (page as any).gotoPath = (path: string, opts?: any) => {
      const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
      return origGoto(url, opts);
    };
    await use(page);
    await page.close().catch(() => {});
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  },
});

export const expect = base.expect;
