"use client";

import Link from "next/link";
import { Brand } from "@/components/branding/brand";
import { useBrand } from "@/components/branding/brand-provider";

export function MarketingFooter() {
  const { productName, companyName, contactEmail, privacyUrl, termsUrl } =
    useBrand();

  return (
    <footer className="shell py-12">
      <div className="flex flex-col gap-8 border-b pb-10 md:flex-row md:items-center md:justify-between">
        <Brand />
        <nav className="flex flex-wrap gap-5 text-sm text-muted-foreground">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <Link href={privacyUrl}>Privacy</Link>
          <Link href={termsUrl}>Terms</Link>
          <a href={`mailto:${contactEmail}`}>Contact</a>
        </nav>
      </div>
      <div className="flex flex-col gap-2 pt-8 text-xs text-muted-foreground sm:flex-row sm:justify-between">
        <p>
          © {new Date().getFullYear()} {companyName}. All rights reserved.
        </p>
        <p>
          {productName} is a product by {companyName}.
        </p>
      </div>
    </footer>
  );
}
