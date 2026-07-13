import { getDb } from "@/lib/db";
import {
  messageSchema,
  type Message,
  type MessageMetadata,
} from "@/lib/db/schema";

function rowToMessage(row: Record<string, unknown>): Message {
  return messageSchema.parse(row);
}

export interface AddMessageInput {
  conversationId: number;
  role: "user" | "assistant";
  text: string;
  audioPath?: string | null;
  grammarScore?: number | null;
  pronunciationScore?: number | null;
  fluencyScore?: number | null;
  metadata?: MessageMetadata | null;
}

export function addMessage(input: AddMessageInput): Message {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO messages (
        conversation_id, role, text, audio_path,
        grammar_score, pronunciation_score, fluency_score, metadata
      ) VALUES (
        @conversationId, @role, @text, @audioPath,
        @grammarScore, @pronunciationScore, @fluencyScore, @metadata
      )`,
    )
    .run({
      conversationId: input.conversationId,
      role: input.role,
      text: input.text,
      audioPath: input.audioPath ?? null,
      grammarScore: input.grammarScore ?? null,
      pronunciationScore: input.pronunciationScore ?? null,
      fluencyScore: input.fluencyScore ?? null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    });

  const message = getMessageById(Number(result.lastInsertRowid));
  if (!message) throw new Error("Failed to add message");
  return message;
}

export function getMessageById(id: number): Message | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM messages WHERE id = ?").get(id);
  if (!row) return null;
  return rowToMessage(row as Record<string, unknown>);
}

export function getMessages(conversationId: number): Message[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC`,
    )
    .all(conversationId);

  return rows.map((row) => rowToMessage(row as Record<string, unknown>));
}

export function updateMessageAudioPath(
  messageId: number,
  audioPath: string,
): void {
  const db = getDb();
  db.prepare("UPDATE messages SET audio_path = ? WHERE id = ?").run(
    audioPath,
    messageId,
  );
}

export function getRecentMessages(
  conversationId: number,
  limit = 10,
): Message[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM messages WHERE conversation_id = ?
       ORDER BY created_at DESC LIMIT ?`,
    )
    .all(conversationId, limit);

  return rows
    .map((row) => rowToMessage(row as Record<string, unknown>))
    .reverse();
}
