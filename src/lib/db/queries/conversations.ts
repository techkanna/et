import { getDb } from "@/lib/db";
import { conversationSchema, type Conversation } from "@/lib/db/schema";
import { getUser } from "@/lib/db/queries/users";

function rowToConversation(row: Record<string, unknown>): Conversation {
  return conversationSchema.parse(row);
}

export function createConversation(mode = "free", title?: string): Conversation {
  const user = getUser();
  if (!user) throw new Error("No user found");

  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO conversations (user_id, mode, title) VALUES (?, ?, ?)`,
    )
    .run(user.id, mode, title ?? null);

  const conversation = getConversation(Number(result.lastInsertRowid));
  if (!conversation) throw new Error("Failed to create conversation");
  return conversation;
}

export function getConversation(id: number): Conversation | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM conversations WHERE id = ?").get(id);
  if (!row) return null;
  return rowToConversation(row as Record<string, unknown>);
}

export function listConversations(limit = 20): Conversation[] {
  const user = getUser();
  if (!user) return [];

  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM conversations WHERE user_id = ? ORDER BY started_at DESC LIMIT ?`,
    )
    .all(user.id, limit);

  return rows.map((row) =>
    rowToConversation(row as Record<string, unknown>),
  );
}

export function endConversation(
  id: number,
  durationSeconds?: number,
  summary?: string,
): Conversation {
  const db = getDb();
  const existing = getConversation(id);
  if (!existing) throw new Error("Conversation not found");

  const startedAt = new Date(existing.started_at).getTime();
  const duration =
    durationSeconds ?? Math.round((Date.now() - startedAt) / 1000);

  db.prepare(
    `UPDATE conversations SET ended_at = datetime('now'), duration_seconds = ?, summary = ? WHERE id = ?`,
  ).run(duration, summary ?? existing.summary, id);

  const updated = getConversation(id);
  if (!updated) throw new Error("Failed to end conversation");
  return updated;
}
