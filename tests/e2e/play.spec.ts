import { expect, test } from "@playwright/test";

test("boots and responds to keyboard controls", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "START" })).toBeVisible();
  await page.keyboard.press("Enter");
  await page.keyboard.down("ArrowRight");
  await page.keyboard.down("ArrowUp");
  await page.waitForTimeout(900);
  await page.keyboard.up("ArrowRight");
  await page.keyboard.up("ArrowUp");
  await expect(page.locator("#score")).toContainText(/\d{6}/);
  await expect(page.locator("#speed")).not.toHaveText("000");
  await expect(page.locator("canvas")).toBeVisible();
});

test("mobile controls are visible and can start/jump", async ({ page, isMobile }) => {
  await page.goto("/");
  await expect(page.locator(".mobile-controls")).toBeVisible();
  await page.getByRole("button", { name: "START" }).click();
  await page.getByRole("button", { name: "Jump" }).click();
  await page.waitForTimeout(isMobile ? 600 : 300);
  await expect(page.locator("#title-panel")).toHaveClass(/is-hidden/);
  await expect(page.locator("#time")).not.toHaveText("70");
});
