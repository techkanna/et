export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GrammarCorrection {
  wrong: string;
  correct: string;
  explanation: string;
}

export interface NewVocabulary {
  word: string;
  meaning: string;
}

export interface Scores {
  grammar: number;
  fluency: number;
  confidence: number;
}

export interface TeacherResponse {
  teacherReply: string;
  grammarCorrections: GrammarCorrection[];
  newVocabulary: NewVocabulary[];
  scores: Scores;
}

export interface ConversationMessageResult {
  teacherReply: string;
  transcript: string;
  audioUrl: string;
  scores: Scores;
  grammarCorrections: GrammarCorrection[];
  newVocabulary: NewVocabulary[];
  userMessageId: number;
  assistantMessageId: number;
}
