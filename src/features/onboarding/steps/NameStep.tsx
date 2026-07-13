"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NameStepProps {
  value: string;
  onChange: (value: string) => void;
}

export function NameStep({ value, onChange }: NameStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold">Welcome to ET!</h2>
        <p className="text-muted-foreground">
          I&apos;m your private English speaking coach. What should I call you?
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Your name</Label>
        <Input
          id="name"
          placeholder="Enter your name"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
        />
      </div>
    </div>
  );
}
