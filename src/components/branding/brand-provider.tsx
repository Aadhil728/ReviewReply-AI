"use client";

import { createContext, useContext } from "react";

const BrandContext = createContext({
  productName: "ReviewReply AI",
  companyName: "Aara Creations",
  contactEmail: "hello@aaracreations.com",
  privacyUrl: "/privacy",
  termsUrl: "/terms",
});

export function BrandProvider({
  productName,
  companyName,
  contactEmail,
  privacyUrl,
  termsUrl,
  children,
}: {
  productName: string;
  companyName: string;
  contactEmail: string;
  privacyUrl: string;
  termsUrl: string;
  children: React.ReactNode;
}) {
  return (
    <BrandContext.Provider
      value={{ productName, companyName, contactEmail, privacyUrl, termsUrl }}
    >
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  return useContext(BrandContext);
}
