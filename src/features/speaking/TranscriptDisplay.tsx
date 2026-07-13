"use client";

interface TranscriptDisplayProps {
  text: string;
}

export function TranscriptDisplay({ text }: TranscriptDisplayProps) {
  if (!text) return null;

  return (
    <div className="rounded-lg bg-muted/50 px-4 py-3 text-center text-sm">
      {text}
    </div>
  );
}
