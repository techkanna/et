import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface GoalProgressProps {
  completedMinutes: number;
  goalMinutes: number;
}

export function GoalProgress({
  completedMinutes,
  goalMinutes,
}: GoalProgressProps) {
  const percent = Math.min(100, (completedMinutes / goalMinutes) * 100);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Today&apos;s Goal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={percent} />
        <p className="text-sm text-muted-foreground">
          {Math.round(completedMinutes)}/{goalMinutes} min
        </p>
      </CardContent>
    </Card>
  );
}
