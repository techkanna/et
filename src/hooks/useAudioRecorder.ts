"use client";

import { useCallback, useRef, useState } from "react";
import { createRecorder, type AudioRecorder } from "@/lib/audio/recorder";
import { startVad } from "@/lib/audio/vad";

export function useAudioRecorder() {
  const recorderRef = useRef<AudioRecorder | null>(null);
  const stopVadRef = useRef<(() => void) | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    stopVadRef.current?.();
    stopVadRef.current = null;

    if (!recorderRef.current) return null;
    const blob = await recorderRef.current.stop();
    recorderRef.current = null;
    setIsRecording(false);
    setAnalyser(null);
    return blob.size > 0 ? blob : null;
  }, []);

  const startRecording = useCallback(async () => {
    const recorder = await createRecorder();
    recorderRef.current = recorder;
    await recorder.start();
    setIsRecording(true);
    setAnalyser(recorder.getAnalyser());

    const analyserNode = recorder.getAnalyser();
    if (analyserNode) {
      stopVadRef.current = startVad(analyserNode, {
        onSilence: async () => {
          if (recorderRef.current?.getState() === "recording") {
            stopVadRef.current?.();
            stopVadRef.current = null;
            await recorderRef.current.stop();
            recorderRef.current = null;
            setIsRecording(false);
            setAnalyser(null);
          }
        },
      });
    }
  }, []);

  return {
    isRecording,
    analyser,
    startRecording,
    stopRecording,
  };
}
