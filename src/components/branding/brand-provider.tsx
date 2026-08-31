"use client";

import { createContext, useContext } from "react";

const BrandContext = createContext({
  productName: "ReviewReply AI",
  companyName: "Aara Creations",
  contactEmail: "hello@aaracreations.com",
  privacyUrl: "/privacy",
  termsUrl: "/terms",
  primaryColor: "#6541dc",
  logoData: "",
  faviconData: "",
});

export function BrandProvider({
  productName,
  companyName,
  contactEmail,
  privacyUrl,
  termsUrl,
  primaryColor,
  logoData,
  faviconData,
  children,
}: {
  productName: string;
  companyName: string;
  contactEmail: string;
  privacyUrl: string;
  termsUrl: string;
  children: React.ReactNode;
  primaryColor: string;
  logoData: string;
  faviconData: string;
}) {
  return (
    <BrandContext.Provider
      value={{
        productName,
        companyName,
        contactEmail,
        privacyUrl,
        termsUrl,
        primaryColor,
        logoData,
        faviconData,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  return useContext(BrandContext);
}
