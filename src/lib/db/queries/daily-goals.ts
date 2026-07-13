import { getDb } from "@/lib/db";
import { dailyGoalSchema, type DailyGoal } from "@/lib/db/schema";
import { getUser } from "@/lib/db/queries/users";

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function rowToDailyGoal(row: Record<string, unknown>): DailyGoal {
  return dailyGoalSchema.parse(row);
}

export function getTodayGoal(): DailyGoal | null {
  const user = getUser();
  if (!user) return null;

  const db = getDb();
  const date = todayDate();
  let row = db
    .prepare("SELECT * FROM daily_goals WHERE date = ? AND user_id = ?")
    .get(date, user.id);

  if (!row) {
    db.prepare(
      `INSERT INTO daily_goals (date, user_id, goal_minutes, completed_minutes, completed)
       VALUES (?, ?, ?, 0, 0)`,
    ).run(date, user.id, user.daily_goal_minutes);
    row = db
      .prepare("SELECT * FROM daily_goals WHERE date = ? AND user_id = ?")
      .get(date, user.id);
  }

  if (!row) return null;
  return rowToDailyGoal(row as Record<string, unknown>);
}

export function updateGoalProgress(minutes: number): DailyGoal {
  const user = getUser();
  if (!user) throw new Error("No user found");

  const goal = getTodayGoal();
  if (!goal) throw new Error("No daily goal found");

  const newCompleted = goal.completed_minutes + minutes;
  const isCompleted = newCompleted >= goal.goal_minutes ? 1 : 0;

  const db = getDb();
  db.prepare(
    `UPDATE daily_goals SET completed_minutes = ?, completed = ? WHERE date = ? AND user_id = ?`,
  ).run(newCompleted, isCompleted, goal.date, user.id);

  const updated = getTodayGoal();
  if (!updated) throw new Error("Failed to update goal");
  return updated;
}
