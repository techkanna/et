import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CreditsBadgeProps {
  credits: number;
}

export function CreditsBadge({ credits }: CreditsBadgeProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <Star className="size-5 text-yellow-500" />
        <div className="text-lg font-semibold">{credits} Credits</div>
      </CardContent>
    </Card>
  );
}
