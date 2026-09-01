import { Buffer } from "node:buffer";
import { expect, test } from "@playwright/test";
import {
  adminCredentials,
  expectNoHorizontalOverflow,
  signIn,
} from "./helpers";

const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

test.beforeEach(async ({ page }) => {
  test.skip(
    !adminCredentials.email || !adminCredentials.password,
    "Set E2E administrator credentials to run owner coverage.",
  );
  await signIn(page, adminCredentials);
  await expect(page).toHaveURL(/\/dashboard/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin/);
});

test("administrator sees actionable bento overview", async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: "Administration" }),
  ).toBeVisible();
  await expect(page.getByText("Quick management")).toBeVisible();
  await expect(page.getByText("Needs attention")).toBeVisible();
  await expect(page.getByText("System status")).toBeVisible();
  await expect(
    page.getByRole("link", { name: /manage users/i }),
  ).toHaveAttribute("href", "/admin/users");
  await expectNoHorizontalOverflow(page);
});

test("administrator can reach every management area", async ({ page }) => {
  const pages = [
    ["/admin/users", /^users$/i],
    ["/admin/plans", /^plans$/i],
    ["/admin/subscriptions", /^subscriptions$/i],
    ["/admin/bank-transfers", /^bank transfers$/i],
    ["/admin/webhooks", /^webhooks$/i],
    ["/admin/settings", /^configuration$/i],
    ["/admin/audit", /admin audit log/i],
  ] as const;

  for (const [path, heading] of pages) {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { level: 1, name: heading }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});

test("branding color previews immediately without saving", async ({ page }) => {
  await page.goto("/admin/settings#branding");
  await page.getByLabel("Primary color").fill("#146b55");
  await expect(page.locator("html")).toHaveCSS("--brand-primary", "#146b55");
  await expect(page.getByText("#146b55", { exact: true })).toBeVisible();
});

test("logo and favicon controls accept replacement images", async ({
  page,
}) => {
  await page.goto("/admin/settings#branding");

  const logoField = page
    .getByText("Product logo", { exact: true })
    .locator("..");
  await logoField.locator('input[type="file"]').setInputFiles({
    name: "logo.png",
    mimeType: "image/png",
    buffer: onePixelPng,
  });
  await expect(logoField.getByAltText("Product logo preview")).toBeVisible();
  await expect(
    logoField.getByRole("button", { name: "Replace image" }),
  ).toBeVisible();

  const faviconField = page
    .getByText("Browser favicon", { exact: true })
    .locator("..");
  await faviconField.locator('input[type="file"]').setInputFiles({
    name: "favicon.png",
    mimeType: "image/png",
    buffer: onePixelPng,
  });
  await expect(
    faviconField.getByAltText("Browser favicon preview"),
  ).toBeVisible();
});

test("completed installations keep the public installer locked", async ({
  page,
}) => {
  await page.goto("/install");
  await expect(
    page.getByRole("heading", { name: "Installer locked" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /complete installation/i }),
  ).toHaveCount(0);
});
