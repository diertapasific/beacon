import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) redirect("/auth/login");

  // One skill per user (MVP) — if a path exists, there's nothing to onboard.
  const path = await prisma.learningPath.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (path) redirect("/dashboard");

  return <OnboardingWizard />;
}
