"use client";

import { cn } from "@/lib/utils";

const targets = [15, 30, 45, 60];

interface DailyTargetStepProps {
  value: number;
  onChange: (value: number) => void;
}

export function DailyTargetStep({ value, onChange }: DailyTargetStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold">Daily practice target</h2>
        <p className="text-muted-foreground">
          How many minutes do you want to practice each day?
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {targets.map((minutes) => (
          <button
            key={minutes}
            type="button"
            onClick={() => onChange(minutes)}
            className={cn(
              "rounded-xl border p-6 text-center transition-colors",
              value === minutes
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-muted/50",
            )}
          >
            <div className="text-2xl font-semibold">{minutes}</div>
            <div className="text-sm text-muted-foreground">minutes</div>
          </button>
        ))}
      </div>
    </div>
  );
}
