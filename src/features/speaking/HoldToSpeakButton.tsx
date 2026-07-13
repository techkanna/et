"use client";

import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HoldToSpeakButtonProps {
  disabled?: boolean;
  isRecording: boolean;
  onPressStart: () => void;
  onPressEnd: () => void;
}

export function HoldToSpeakButton({
  disabled,
  isRecording,
  onPressStart,
  onPressEnd,
}: HoldToSpeakButtonProps) {
  return (
    <Button
      size="lg"
      className={cn(
        "h-14 w-full text-base select-none",
        isRecording && "bg-destructive hover:bg-destructive/90",
      )}
      disabled={disabled}
      onPointerDown={(e) => {
        e.preventDefault();
        onPressStart();
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        onPressEnd();
      }}
      onPointerLeave={(e) => {
        if (isRecording) {
          e.preventDefault();
          onPressEnd();
        }
      }}
    >
      <Mic className="size-5" />
      {isRecording ? "Release to Send" : "Hold to Speak"}
    </Button>
  );
}
