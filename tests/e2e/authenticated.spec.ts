import { expect, test } from "@playwright/test";
import {
  customerCredentials,
  expectNoHorizontalOverflow,
  signIn,
} from "./helpers";

test.beforeEach(async ({ page }) => {
  test.skip(
    !customerCredentials.email || !customerCredentials.password,
    "Set E2E customer credentials to run authenticated coverage.",
  );
  await signIn(page, customerCredentials);
  await expect(page).toHaveURL(/\/dashboard/);
});

test("customer can sign in and reach the generator", async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: /write the right response/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /generate reply/i }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("customer workspace pages render without horizontal overflow", async ({
  page,
}) => {
  const pages = [
    ["/dashboard/history", /your recent replies/i],
    ["/dashboard/business", /business profiles/i],
    ["/dashboard/usage", /^usage$/i],
    ["/dashboard/settings", /^settings$/i],
    ["/dashboard/upgrade", /choose the plan that fits/i],
  ] as const;

  for (const [path, heading] of pages) {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { level: 1, name: heading }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});

test("customer preferences persist after refresh", async ({ page }) => {
  await page.goto("/dashboard/settings");
  await page.getByLabel("Default response length").selectOption("DETAILED");
  await page.getByLabel("Default language").selectOption("SPANISH");
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByText("Preferences saved")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Default response length")).toHaveValue(
    "DETAILED",
  );
  await expect(page.getByLabel("Default language")).toHaveValue("SPANISH");
});

test("theme selection persists across navigation", async ({ page }) => {
  const html = page.locator("html");
  await page
    .getByRole("button", { name: "Toggle color theme" })
    .first()
    .click();
  const selectedDark = await html.evaluate((element) =>
    element.classList.contains("dark"),
  );
  await page.goto("/dashboard/usage");
  await expect(html).toHaveClass(selectedDark ? /dark/ : /light/);
});

test("customer sees manual bank-transfer upgrade option", async ({ page }) => {
  await page.goto("/dashboard/upgrade");
  await expect(
    page.getByRole("heading", { name: "Bank-transfer instructions" }),
  ).toBeVisible();
  await expect(page.getByText("E2E National Bank")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Bank transfer" }).first(),
  ).toBeVisible();
});

test("customer cannot enter the owner administration", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(
    page.getByRole("heading", { name: /write the right response/i }),
  ).toBeVisible();
});
