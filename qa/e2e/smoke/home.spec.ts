import { test, expect } from "../fixtures";
import { HomePage } from "../page-objects/home";

test.describe("Home page smoke", () => {
  let home: HomePage;

  test.beforeEach(({ page }) => {
    home = new HomePage(page);
  });

  test("app starts and home page renders key sections", async ({ page }) => {
    const response = await home.goto("/");
    home.expectStatusOk(response);
    await home.expectLoaded();
  });

  test("renders the language picker with live kikuyu and swahili cards", async ({
    page,
  }) => {
    await home.goto("/");
    await home.expectLoaded();
    await expect(home.kikuyuCard).toContainText(/Gĩkũyũ|Kikuyu/i);
    await expect(home.swahiliCard).toContainText(/Kiswahili|Swahili/i);
    // Each live card links to its published language page.
    await expect(home.kikuyuCard).toHaveAttribute("href", "/languages/kikuyu");
    await expect(home.swahiliCard).toHaveAttribute("href", "/languages/swahili");
  });

  test("demo chat input is present and submittable", async ({ page }) => {
    await home.goto("/");
    await home.expectLoaded();
    await expect(home.chatInput).toBeEditable();
    await home.chatInput.fill("Habari yako");
    await expect(home.chatInput).toHaveValue("Habari yako");
    await expect(home.submitButton).toBeEnabled();
  });
});
