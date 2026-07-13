import { config } from "@/lib/config";
import { mockSynthesize } from "@/lib/ai/mock";

export async function synthesize(text: string): Promise<ArrayBuffer> {
  if (config.ET_MOCK_AI) {
    return mockSynthesize();
  }

  const response = await fetch(`${config.ET_TTS_BASE_URL}/v1/audio/speech`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "tts-1",
      input: text,
      voice: "alloy",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`TTS request failed (${response.status}): ${text}`);
  }

  return response.arrayBuffer();
}
