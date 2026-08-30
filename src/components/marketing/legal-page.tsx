"use client";

import Link from "next/link";
import { Brand } from "@/components/branding/brand";
import { useBrand } from "@/components/branding/brand-provider";
export function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: string[];
}) {
  const { productName } = useBrand();
  return (
    <>
      <header className="shell flex h-20 items-center justify-between">
        <Brand />
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Back home
        </Link>
      </header>
      <main className="shell max-w-3xl py-16">
        <p className="eyebrow">Legal</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">{title}</h1>
        <p className="mt-5 text-lg text-muted-foreground">{intro}</p>
        <div className="mt-8 rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-warning">
          Draft for product development. This document requires review by
          qualified legal counsel before production launch.
        </div>
        <div className="mt-12 space-y-10">
          {sections.map((section, index) => (
            <section key={section}>
              <h2 className="text-xl font-bold">
                {index + 1}. {section}
              </h2>
              <p className="mt-3 leading-7 text-muted-foreground">
                This section will describe {productName}&apos;s practices and
                the responsibilities of users in clear, product-specific
                language after legal review.
              </p>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
