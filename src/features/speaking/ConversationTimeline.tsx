"use client";

import { useEffect, useRef } from "react";
import type { TimelineMessage } from "@/stores/speaking-store";
import { cn } from "@/lib/utils";

interface ConversationTimelineProps {
  messages: TimelineMessage[];
}

export function ConversationTimeline({ messages }: ConversationTimelineProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div className="flex max-h-48 flex-col gap-2 overflow-y-auto rounded-lg border p-3">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={cn(
            "rounded-lg px-3 py-2 text-sm",
            msg.role === "user"
              ? "ml-8 bg-primary/10"
              : "mr-8 bg-muted",
          )}
        >
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            {msg.role === "user" ? "You" : "ET"}
          </span>
          {msg.text}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
