import { z } from "zod";

export const englishLevelSchema = z.enum([
  "beginner",
  "intermediate",
  "advanced",
]);

export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  native_language: z.string(),
  english_level: englishLevelSchema,
  learning_goal: z.string().nullable(),
  daily_goal_minutes: z.number(),
  current_streak: z.number(),
  longest_streak: z.number(),
  credits: z.number(),
  xp: z.number(),
  created_at: z.string(),
});

export const createUserSchema = z.object({
  name: z.string().min(1),
  native_language: z.string().default("Tamil"),
  english_level: englishLevelSchema.default("intermediate"),
  learning_goal: z.string().optional(),
  daily_goal_minutes: z.number().int().positive().default(30),
});

export const updateUserSchema = createUserSchema.partial();

export const conversationSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  title: z.string().nullable(),
  mode: z.string(),
  scenario: z.string().nullable(),
  started_at: z.string(),
  ended_at: z.string().nullable(),
  duration_seconds: z.number(),
  summary: z.string().nullable(),
});

export const messageRoleSchema = z.enum(["user", "assistant"]);

export const grammarCorrectionSchema = z.object({
  wrong: z.string(),
  correct: z.string(),
  explanation: z.string(),
});

export const newVocabularySchema = z.object({
  word: z.string(),
  meaning: z.string(),
});

export const scoresSchema = z.object({
  grammar: z.number().min(0).max(100),
  fluency: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
});

export const messageMetadataSchema = z.object({
  grammarCorrections: z.array(grammarCorrectionSchema).default([]),
  newVocabulary: z.array(newVocabularySchema).default([]),
  confidence: z.number().optional(),
});

export const teacherResponseSchema = z.object({
  teacherReply: z.string(),
  grammarCorrections: z.array(grammarCorrectionSchema).default([]),
  newVocabulary: z.array(newVocabularySchema).default([]),
  scores: scoresSchema,
});

export const messageSchema = z.object({
  id: z.number(),
  conversation_id: z.number(),
  role: messageRoleSchema,
  text: z.string(),
  audio_path: z.string().nullable(),
  grammar_score: z.number().nullable(),
  pronunciation_score: z.number().nullable(),
  fluency_score: z.number().nullable(),
  metadata: z.string().nullable(),
  created_at: z.string(),
});

export const dailyGoalSchema = z.object({
  date: z.string(),
  user_id: z.number(),
  goal_minutes: z.number(),
  completed_minutes: z.number(),
  completed: z.number(),
});

export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
export type Message = z.infer<typeof messageSchema>;
export type DailyGoal = z.infer<typeof dailyGoalSchema>;
export type TeacherResponse = z.infer<typeof teacherResponseSchema>;
export type MessageMetadata = z.infer<typeof messageMetadataSchema>;
export type EnglishLevel = z.infer<typeof englishLevelSchema>;
