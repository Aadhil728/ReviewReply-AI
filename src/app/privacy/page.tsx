import { LegalPage } from "@/components/marketing/legal-page";
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="How this service handles account, business, and review-response data."
      sections={[
        "Information we collect",
        "How we use information",
        "AI processing and service providers",
        "Data retention and deletion",
        "Security",
        "Your choices and rights",
        "Contact",
      ]}
    />
  );
}
