import { teacherResponseSchema, type TeacherResponse } from "@/lib/db/schema";

export function parseTeacherResponse(raw: string): TeacherResponse {
  const trimmed = raw.trim();

  // Try to extract JSON from markdown code blocks
  const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : trimmed;

  try {
    const parsed = JSON.parse(jsonStr);
    const result = teacherResponseSchema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }
  } catch {
    // fall through to fallback
  }

  return {
    teacherReply: trimmed,
    grammarCorrections: [],
    newVocabulary: [],
    scores: { grammar: 70, fluency: 70, confidence: 70 },
  };
}
