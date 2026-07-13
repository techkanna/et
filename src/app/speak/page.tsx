import { redirect } from "next/navigation";
import { getUser } from "@/lib/db/queries/users";
import { SpeakingSession } from "@/features/speaking/SpeakingSession";

export const dynamic = "force-dynamic";

export default function SpeakPage() {
  const user = getUser();
  if (!user) {
    redirect("/onboarding");
  }

  return <SpeakingSession />;
}
