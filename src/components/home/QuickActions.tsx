import Link from "next/link";
import { Mic, Theater } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function QuickActions() {
  return (
    <div className="flex flex-col gap-3">
      <Link
        href="/speak"
        className={cn(
          buttonVariants({ size: "lg" }),
          "h-14 w-full text-base",
        )}
      >
        <Mic className="size-5" />
        Continue Talking
      </Link>

      <Button
        variant="outline"
        size="lg"
        className="h-14 w-full text-base"
        disabled
      >
        <Theater className="size-5" />
        Start Role Play
      </Button>

      <Card className="opacity-60">
        <CardContent className="py-4">
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            More options...
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>Daily Challenge</span>
            <span>·</span>
            <span>Vocabulary</span>
            <span>·</span>
            <span>Mistakes</span>
            <span>·</span>
            <span>Progress</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
