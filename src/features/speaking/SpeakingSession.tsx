"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Square, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { createPlayer } from "@/lib/audio/playback";
import { useSpeakingStore } from "@/stores/speaking-store";
import { AvatarAnimation } from "@/features/speaking/AvatarAnimation";
import { WaveformVisualizer } from "@/features/speaking/WaveformVisualizer";
import { TranscriptDisplay } from "@/features/speaking/TranscriptDisplay";
import { ConversationTimeline } from "@/features/speaking/ConversationTimeline";
import { HoldToSpeakButton } from "@/features/speaking/HoldToSpeakButton";

export function SpeakingSession() {
  const router = useRouter();
  const playerRef = useRef(createPlayer(() => setStatus("idle")));
  const {
    conversationId,
    status,
    messages,
    liveTranscript,
    setConversationId,
    setStatus,
    setLiveTranscript,
    addMessage,
    reset,
  } = useSpeakingStore();

  const { isRecording, analyser, startRecording, stopRecording } =
    useAudioRecorder();

  useEffect(() => {
    async function init() {
      const res = await fetch("/api/conversation/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "free" }),
      });
      if (res.ok) {
        const data = await res.json();
        setConversationId(data.conversationId);
      }
    }
    init();

    return () => {
      reset();
    };
  }, [setConversationId, reset]);

  const sendAudio = useCallback(
    async (blob: Blob) => {
      if (!conversationId) return;

      setStatus("thinking");
      setLiveTranscript("");

      const formData = new FormData();
      formData.append("conversationId", String(conversationId));
      formData.append("audio", blob, "recording.webm");

      try {
        const res = await fetch("/api/conversation/message", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Failed to send message");

        const data = await res.json();

        addMessage({
          id: data.userMessageId,
          role: "user",
          text: data.transcript,
        });
        addMessage({
          id: data.assistantMessageId,
          role: "assistant",
          text: data.teacherReply,
          audioUrl: data.audioUrl,
        });

        setLiveTranscript(data.teacherReply);
        setStatus("speaking");
        await playerRef.current.play(data.audioUrl);
      } catch {
        setStatus("idle");
        setLiveTranscript("Something went wrong. Please try again.");
      }
    },
    [conversationId, setStatus, setLiveTranscript, addMessage],
  );

  const handlePressStart = async () => {
    if (status !== "idle" || !conversationId) return;
    setStatus("listening");
    await startRecording();
  };

  const handlePressEnd = async () => {
    if (!isRecording) return;
    const blob = await stopRecording();
    if (blob) {
      await sendAudio(blob);
    } else {
      setStatus("idle");
    }
  };

  const handleEndSession = async () => {
    if (conversationId) {
      await fetch("/api/conversation/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });
    }
    playerRef.current.stop();
    reset();
    router.push("/");
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-8 pb-24">
      <AvatarAnimation status={status} />
      <WaveformVisualizer
        analyser={analyser}
        active={status === "listening"}
      />
      <TranscriptDisplay text={liveTranscript} />
      <HoldToSpeakButton
        disabled={!conversationId || status === "thinking" || status === "speaking"}
        isRecording={isRecording}
        onPressStart={handlePressStart}
        onPressEnd={handlePressEnd}
      />

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleEndSession}
        >
          <Square className="size-4" />
          Stop
        </Button>
        <Button variant="outline" className="flex-1" disabled>
          <FileText className="size-4" />
          Text
        </Button>
      </div>

      <ConversationTimeline messages={messages} />
    </div>
  );
}
