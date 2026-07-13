import { redirect } from "next/navigation";
import { getUser } from "@/lib/db/queries/users";
import { getTodayGoal } from "@/lib/db/queries/daily-goals";
import { GreetingHeader } from "@/components/home/GreetingHeader";
import { StreakCard } from "@/components/home/StreakCard";
import { GoalProgress } from "@/components/home/GoalProgress";
import { CreditsBadge } from "@/components/home/CreditsBadge";
import { QuickActions } from "@/components/home/QuickActions";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const user = getUser();
  if (!user) {
    redirect("/onboarding");
  }

  const goal = getTodayGoal();

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-8 pb-24">
      <GreetingHeader name={user.name} />
      <StreakCard currentStreak={user.current_streak} />
      {goal && (
        <GoalProgress
          completedMinutes={goal.completed_minutes}
          goalMinutes={goal.goal_minutes}
        />
      )}
      <CreditsBadge credits={user.credits} />
      <QuickActions />
    </div>
  );
}
