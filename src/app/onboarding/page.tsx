import { redirect } from "next/navigation";
import { hasUser } from "@/lib/db/queries/users";
import { OnboardingWizard } from "@/features/onboarding/OnboardingWizard";

export const dynamic = "force-dynamic";

export default function OnboardingPage() {
  if (hasUser()) {
    redirect("/");
  }

  return <OnboardingWizard />;
}
