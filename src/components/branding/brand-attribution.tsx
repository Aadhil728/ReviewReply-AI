"use client";

import { useBrand } from "./brand-provider";

export function BrandAttribution({
  prefix = "A product by",
}: {
  prefix?: string;
}) {
  const { productName, companyName } = useBrand();
  return (
    <>
      {prefix === "product"
        ? `${productName} by ${companyName}`
        : `${prefix} ${companyName}.`}
    </>
  );
}
