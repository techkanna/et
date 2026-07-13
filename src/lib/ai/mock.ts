import type { TeacherResponse } from "@/lib/ai/types";

export function mockTranscribe(): string {
  return "Hello, I want to practice speaking English today.";
}

export function mockTeacherResponse(): TeacherResponse {
  return {
    teacherReply:
      "That's wonderful! I'm glad you're here to practice. What would you like to talk about today — work, hobbies, or something from your daily life?",
    grammarCorrections: [],
    newVocabulary: [
      { word: "practice", meaning: "to do something repeatedly to improve" },
    ],
    scores: { grammar: 85, fluency: 80, confidence: 75 },
  };
}

export function mockSynthesize(): ArrayBuffer {
  // Minimal valid silent MP3 frame (very short)
  const bytes = new Uint8Array([
    0xff, 0xfb, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]);
  return bytes.buffer;
}
