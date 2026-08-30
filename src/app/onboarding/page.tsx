import { requireSession } from "@/lib/session";
import { OnboardingForm } from "@/components/dashboard/onboarding-form";
export default async function Onboarding() {
  await requireSession();
  return <OnboardingForm />;
}
