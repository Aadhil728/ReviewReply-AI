import { LegalPage } from "@/components/marketing/legal-page";
export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro="The terms that apply when using this service."
      sections={[
        "Using the service",
        "Accounts and acceptable use",
        "AI-generated content",
        "Plans and usage limits",
        "Intellectual property",
        "Availability and changes",
        "Disclaimers and liability",
        "Contact",
      ]}
    />
  );
}
