import { expect, test } from "@playwright/test";

test("public experience exposes authentication and legal routes", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /get started/i }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", /privacy/);
  await expect(page.getByRole("link", { name: "Terms" })).toHaveAttribute("href", /terms/);
});

test("protected customer and admin routes reject anonymous visitors", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
});

test("password recovery screens are connected", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: /forgot password/i }).click();
  await expect(page).toHaveURL(/\/forgot-password/);
  await expect(page.getByRole("button", { name: /send reset link/i })).toBeVisible();
});
