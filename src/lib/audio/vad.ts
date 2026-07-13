export interface VadOptions {
  silenceThreshold?: number;
  silenceDurationMs?: number;
  onSilence?: () => void;
}

export function startVad(
  analyser: AnalyserNode,
  options: VadOptions = {},
): () => void {
  const {
    silenceThreshold = 10,
    silenceDurationMs = 2000,
    onSilence,
  } = options;

  const data = new Uint8Array(analyser.frequencyBinCount);
  let silenceStart: number | null = null;
  let running = true;

  function check() {
    if (!running) return;

    analyser.getByteFrequencyData(data);
    const average = data.reduce((a, b) => a + b, 0) / data.length;

    if (average < silenceThreshold) {
      if (silenceStart === null) {
        silenceStart = Date.now();
      } else if (Date.now() - silenceStart >= silenceDurationMs) {
        onSilence?.();
        running = false;
        return;
      }
    } else {
      silenceStart = null;
    }

    requestAnimationFrame(check);
  }

  requestAnimationFrame(check);

  return () => {
    running = false;
  };
}
