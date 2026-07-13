"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GoalStepProps {
  value: string;
  onChange: (value: string) => void;
}

export function GoalStep({ value, onChange }: GoalStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold">Your learning goal</h2>
        <p className="text-muted-foreground">
          What do you want to achieve with your English?
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="goal">Learning goal</Label>
        <Input
          id="goal"
          placeholder="e.g. Speak confidently in IT meetings"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
        />
      </div>
    </div>
  );
}
