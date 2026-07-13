import { getDb } from "@/lib/db";
import {
  createUserSchema,
  updateUserSchema,
  userSchema,
  type CreateUserInput,
  type UpdateUserInput,
  type User,
} from "@/lib/db/schema";

function rowToUser(row: Record<string, unknown>): User {
  return userSchema.parse({
    ...row,
    english_level: row.english_level,
  });
}

export function hasUser(): boolean {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) as count FROM users").get() as {
    count: number;
  };
  return row.count > 0;
}

export function getUser(): User | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM users LIMIT 1").get();
  if (!row) return null;
  return rowToUser(row as Record<string, unknown>);
}

export function createUser(input: CreateUserInput): User {
  const data = createUserSchema.parse(input);
  const db = getDb();

  const result = db
    .prepare(
      `INSERT INTO users (name, native_language, english_level, learning_goal, daily_goal_minutes)
       VALUES (@name, @native_language, @english_level, @learning_goal, @daily_goal_minutes)`,
    )
    .run({
      name: data.name,
      native_language: data.native_language,
      english_level: data.english_level,
      learning_goal: data.learning_goal ?? null,
      daily_goal_minutes: data.daily_goal_minutes,
    });

  const user = getUserById(Number(result.lastInsertRowid));
  if (!user) throw new Error("Failed to create user");
  return user;
}

export function getUserById(id: number): User | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  if (!row) return null;
  return rowToUser(row as Record<string, unknown>);
}

export function updateUser(input: UpdateUserInput): User {
  const data = updateUserSchema.parse(input);
  const existing = getUser();
  if (!existing) throw new Error("No user found");

  const fields: string[] = [];
  const values: Record<string, unknown> = { id: existing.id };

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = @${key}`);
      values[key] = value;
    }
  }

  if (fields.length === 0) return existing;

  const db = getDb();
  db.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = @id`).run(
    values,
  );

  const updated = getUserById(existing.id);
  if (!updated) throw new Error("Failed to update user");
  return updated;
}
