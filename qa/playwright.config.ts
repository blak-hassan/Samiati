import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

// Resolve a Chromium executable: Playwright's bundled binary if present,
// otherwise the system Chrome (free, local — no cloud browser).
let chromiumExecutable: string | undefined;
const msPlaywright = "C:\\Users\\pc\\AppData\\Local\\ms-playwright";
if (existsSync(msPlaywright)) {
  for (const entry of (() => {
    try {
      return require("node:fs").readdirSync(msPlaywright);
    } catch {
      return [];
    }
  })()) {
    if (entry.startsWith("chromium-") && existsSync(`${msPlaywright}\\${entry}\\chrome.exe`)) {
      chromiumExecutable = `${msPlaywright}\\${entry}\\chrome.exe`;
      break;
    }
    if (entry.startsWith("chromium_headless_shell-") && existsSync(`${msPlaywright}\\${entry}\\chrome-headless-shell.exe`)) {
      chromiumExecutable = `${msPlaywright}\\${entry}\\chrome-headless-shell.exe`;
      break;
    }
  }
}
if (!chromiumExecutable) {
  chromiumExecutable = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
}

const chromeUse = { executablePath: chromiumExecutable };

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "blob" : "html",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    ...chromeUse,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...chromeUse,
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Force demo mode for QA: no Convex URL and no pk_ Clerk key, so the app
    // uses MockProviders (always-signed-in mock user, no Clerk/Convex/HF).
    // This keeps QA fully local and free, with no credentials required.
    env: {
      ...process.env,
      NEXT_PUBLIC_CONVEX_URL: "",
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "",
    },
  },
});
