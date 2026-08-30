import type { Metadata } from "next";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { BrandProvider } from "@/components/branding/brand-provider";
import { db } from "@/lib/db";
import "./globals.css";

const brandDefaults = {
  productName: "ReviewReply AI",
  companyName: "Aara Creations",
  contactEmail: "hello@aaracreations.com",
  privacyUrl: "/privacy",
  termsUrl: "/terms",
};

async function getBrandSettings() {
  const brand = { ...brandDefaults };
  try {
    const settings = await db.systemSetting.findMany({
      where: {
        key: {
          in: [
            "branding.productName",
            "branding.companyName",
            "branding.contactEmail",
            "branding.privacyUrl",
            "branding.termsUrl",
          ],
        },
        encrypted: false,
      },
    });
    for (const setting of settings) {
      const field = setting.key.replace("branding.", "") as keyof typeof brand;
      if (field in brand && setting.value) brand[field] = setting.value;
    }
  } catch {
    /* Defaults keep installation and error screens available before migrations. */
  }
  return brand;
}

export async function generateMetadata(): Promise<Metadata> {
  const { productName } = await getBrandSettings();
  const description =
    "Write thoughtful, professional responses to customer reviews in seconds.";
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    ),
    title: {
      default: `${productName} — AI Review Response Generator`,
      template: `%s | ${productName}`,
    },
    description,
    openGraph: { title: productName, description, type: "website" },
    twitter: { card: "summary_large_image" },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const brand = await getBrandSettings();
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <BrandProvider {...brand}>
          <ThemeProvider>
            {children}
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </BrandProvider>
      </body>
    </html>
  );
}
