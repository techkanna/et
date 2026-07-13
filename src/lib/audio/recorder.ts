export type RecorderState = "idle" | "recording" | "paused";

export interface AudioRecorder {
  start(): Promise<void>;
  stop(): Promise<Blob>;
  pause(): void;
  resume(): void;
  getAnalyser(): AnalyserNode | null;
  getState(): RecorderState;
}

export async function createRecorder(): Promise<AudioRecorder> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);

  const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : "audio/webm";

  let mediaRecorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];
  let state: RecorderState = "idle";

  return {
    async start() {
      chunks = [];
      mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorder.start(100);
      state = "recording";
    },

    async stop() {
      return new Promise<Blob>((resolve) => {
        if (!mediaRecorder || state === "idle") {
          resolve(new Blob([], { type: mimeType }));
          return;
        }
        mediaRecorder.onstop = () => {
          state = "idle";
          stream.getTracks().forEach((t) => t.stop());
          audioContext.close();
          resolve(new Blob(chunks, { type: mimeType }));
        };
        mediaRecorder.stop();
      });
    },

    pause() {
      mediaRecorder?.pause();
      state = "paused";
    },

    resume() {
      mediaRecorder?.resume();
      state = "recording";
    },

    getAnalyser() {
      return analyser;
    },

    getState() {
      return state;
    },
  };
}
