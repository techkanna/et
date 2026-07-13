import { config } from "@/lib/config";
import type { ChatMessage, TeacherResponse } from "@/lib/ai/types";
import { parseTeacherResponse } from "@/lib/ai/parser";

export async function chat(messages: ChatMessage[]): Promise<TeacherResponse> {
  if (config.ET_MOCK_AI) {
    const { mockTeacherResponse } = await import("@/lib/ai/mock");
    return mockTeacherResponse();
  }

  const response = await fetch(`${config.ET_LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.ET_LLM_MODEL,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 512,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LLM request failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "";
  return parseTeacherResponse(content);
}
