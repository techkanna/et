"use client";

import { cn } from "@/lib/utils";
import type { EnglishLevel } from "@/lib/db/schema";

const levels: {
  value: EnglishLevel;
  label: string;
  example: string;
}[] = [
  {
    value: "beginner",
    label: "Beginner",
    example: "I am learning basic words and simple sentences.",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    example: "I can hold conversations but make grammar mistakes.",
  },
  {
    value: "advanced",
    label: "Advanced",
    example: "I speak fluently but want to refine my accent and vocabulary.",
  },
];

interface LevelStepProps {
  value: EnglishLevel;
  onChange: (value: EnglishLevel) => void;
}

export function LevelStep({ value, onChange }: LevelStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold">Your English level</h2>
        <p className="text-muted-foreground">
          This helps me adapt my teaching to you.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {levels.map((level) => (
          <button
            key={level.value}
            type="button"
            onClick={() => onChange(level.value)}
            className={cn(
              "rounded-xl border p-4 text-left transition-colors",
              value === level.value
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-muted/50",
            )}
          >
            <div className="font-medium">{level.label}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {level.example}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
