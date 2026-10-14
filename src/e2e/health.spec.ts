import { test, expect } from "@playwright/test";

test.describe("App Health & Navigation", () => {
  test("deve carregar a página inicial ou redirecionar para login", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(400);
  });
});
