import { test, expect } from "./fixtures";

const MOBILE_VIEWPORT = { width: 360, height: 800 };

test.describe("Responsive + slow-network checks", () => {
  test("home page at mobile viewport 360x800 renders without horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBeLessThan(400);
    await page.waitForLoadState("networkidle");

    const htmlWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(htmlWidth).toBeLessThanOrEqual(MOBILE_VIEWPORT.width + 1);

    await expect(page.getByRole("heading", { name: /AI that speaks/i })).toBeVisible();
  });

  test("chat input is usable at mobile viewport", async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();

    const input = page.getByLabel("Ask Samiati a question");
    await expect(input).toBeVisible({ timeout: 10_000 });
    await input.fill("mobile query");
    await expect(input).toHaveValue("mobile query");

    const submit = page.getByRole("button", { name: /Send message/i });
    await expect(submit).toBeVisible();
  });

  test("slow 3G-like network via CDP: page still loads", async ({
    page,
    browserName,
  }) => {
    test.setTimeout(90_000);
    // Only Chromium supports CDP network emulation.
    if (browserName !== "chromium") {
      test.skip();
      return;
    }

    const client = await page.context().newCDPSession(page);
    await client.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 400,
      downloadThroughput: (400 * 1024) / 8, // ~400 kbps
      uploadThroughput: (400 * 1024) / 8,
    });

    const response = await page.goto("/", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByRole("heading", { name: /AI that speaks/i })).toBeVisible();
  });
});
