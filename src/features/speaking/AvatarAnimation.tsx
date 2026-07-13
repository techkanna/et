"use client";

import { motion } from "framer-motion";
import type { SessionStatus } from "@/stores/speaking-store";

interface AvatarAnimationProps {
  status: SessionStatus;
}

export function AvatarAnimation({ status }: AvatarAnimationProps) {
  const isActive = status === "speaking" || status === "listening";

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        className="flex size-28 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary"
        animate={
          isActive
            ? { scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }
            : { scale: 1, opacity: 0.9 }
        }
        transition={
          isActive
            ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
            : { duration: 0.3 }
        }
      >
        ET
      </motion.div>
      <p className="text-sm text-muted-foreground">
        {status === "listening" && "Listening..."}
        {status === "thinking" && "Thinking..."}
        {status === "speaking" && "Speaking..."}
        {status === "idle" && "Ready"}
      </p>
    </div>
  );
}
