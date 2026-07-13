import { Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StreakCardProps {
  currentStreak: number;
}

export function StreakCard({ currentStreak }: StreakCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <Flame className="size-6 text-orange-500" />
        <div>
          <div className="text-lg font-semibold">{currentStreak} Day Streak</div>
          <div className="text-sm text-muted-foreground">Keep it going!</div>
        </div>
      </CardContent>
    </Card>
  );
}
