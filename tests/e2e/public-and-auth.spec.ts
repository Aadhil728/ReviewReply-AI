import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./helpers";

test("public experience exposes primary, authentication, and legal routes", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /get started/i }).first(),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Privacy" })).toHaveAttribute(
    "href",
    /privacy/,
  );
  await expect(page.getByRole("link", { name: "Terms" })).toHaveAttribute(
    "href",
    /terms/,
  );
  await expectNoHorizontalOverflow(page);
});

test("authentication screens link registration, login, and recovery", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await page.getByRole("link", { name: /create an account/i }).click();
  await expect(page).toHaveURL(/\/register/);
  await expect(
    page.getByRole("button", { name: /create free account/i }),
  ).toBeVisible();
  await page.goto("/login");
  await page.getByRole("link", { name: /forgot password/i }).click();
  await expect(page).toHaveURL(/\/forgot-password/);
  await expect(
    page.getByRole("button", { name: /send reset link/i }),
  ).toBeVisible();
});

test("protected customer and admin routes reject anonymous visitors", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
});

test("health endpoint returns an operational response", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  const payload = (await response.json()) as { status?: string };
  expect(payload.status).toMatch(/ok|healthy/i);
});

test("new customer can register, onboard, and reach the generator", async ({
  page,
}, testInfo) => {
  test.skip(
    process.env.E2E_MUTATING !== "true",
    "Set E2E_MUTATING=true only against an isolated E2E database.",
  );
  const email = `customer-${testInfo.project.name}-${Date.now()}@reviewreply-e2e.local`;

  await page.goto("/register");
  await page.getByLabel("Name").fill("Playwright Customer");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("ReviewReply-E2E-2026!");
  await page.getByRole("button", { name: /create free account/i }).click();
  await expect(page).toHaveURL(/\/onboarding/);

  await page.getByLabel("Business name").fill("Playwright Cafe");
  await page.getByLabel("Industry").fill("Restaurant");
  await page
    .getByLabel("Preferred response tone")
    .selectOption("WARM_PROFESSIONAL");
  await page.getByLabel("Default language").selectOption("ENGLISH");
  await page.getByRole("button", { name: /start generating/i }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(
    page.getByRole("heading", { name: /write the right response/i }),
  ).toBeVisible();
});
