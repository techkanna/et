import { config } from "@/lib/config";
import { mockTranscribe } from "@/lib/ai/mock";

export async function transcribe(audioBlob: Blob): Promise<string> {
  if (config.ET_MOCK_AI) {
    return mockTranscribe();
  }

  const formData = new FormData();
  formData.append("file", audioBlob, "audio.webm");
  formData.append("model", "whisper-1");

  const response = await fetch(
    `${config.ET_STT_BASE_URL}/v1/audio/transcriptions`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`STT request failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  return data.text ?? "";
}
