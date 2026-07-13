"use client";

import { useEffect, useRef } from "react";

interface WaveformVisualizerProps {
  analyser: AnalyserNode | null;
  active: boolean;
}

export function WaveformVisualizer({
  analyser,
  active,
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser || !active) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
      animRef.current = requestAnimationFrame(draw);
      analyser!.getByteFrequencyData(dataArray);

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      const barWidth = (canvas!.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas!.height;
        ctx!.fillStyle = "oklch(0.556 0 0)";
        ctx!.fillRect(x, canvas!.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [analyser, active]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={60}
      className="mx-auto w-full max-w-xs rounded-lg bg-muted/30"
    />
  );
}
