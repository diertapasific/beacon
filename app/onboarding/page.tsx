import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) redirect("/auth/login");

  return <OnboardingWizard />;
}
