import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { config } from "@/lib/config";
import { migration001 } from "@/lib/db/migrations/001_initial";

let db: Database.Database | null = null;

const MIGRATIONS: { name: string; sql: string }[] = [
  { name: "001_initial.sql", sql: migration001 },
];

function ensureDataDir(dbPath: string) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function runMigrations(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT DEFAULT (datetime('now'))
    )
  `);

  const applied = new Set(
    (
      database
        .prepare("SELECT name FROM _migrations")
        .all() as { name: string }[]
    ).map((r) => r.name),
  );

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.name)) continue;
    database.exec(migration.sql);
    database
      .prepare("INSERT INTO _migrations (name) VALUES (?)")
      .run(migration.name);
  }
}

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.resolve(
      /* turbopackIgnore: true */ process.cwd(),
      config.ET_DATABASE_PATH,
    );
    ensureDataDir(dbPath);
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    runMigrations(db);
  }
  return db;
}
