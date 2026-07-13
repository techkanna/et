-- User (single-user app, but still a table for future flexibility)
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  native_language TEXT DEFAULT 'Tamil',
  english_level TEXT DEFAULT 'intermediate',
  learning_goal TEXT,
  daily_goal_minutes INTEGER DEFAULT 30,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  credits       INTEGER DEFAULT 0,
  xp            INTEGER DEFAULT 0,
  created_at    TEXT DEFAULT (datetime('now'))
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id),
  title         TEXT,
  mode          TEXT NOT NULL DEFAULT 'free',
  scenario      TEXT,
  started_at    TEXT DEFAULT (datetime('now')),
  ended_at      TEXT,
  duration_seconds INTEGER DEFAULT 0,
  summary       TEXT
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id),
  role            TEXT NOT NULL,
  text            TEXT NOT NULL,
  audio_path      TEXT,
  grammar_score   REAL,
  pronunciation_score REAL,
  fluency_score   REAL,
  metadata        TEXT,
  created_at      TEXT DEFAULT (datetime('now'))
);

-- Daily Goals
CREATE TABLE IF NOT EXISTS daily_goals (
  date              TEXT PRIMARY KEY,
  user_id           INTEGER NOT NULL REFERENCES users(id),
  goal_minutes      INTEGER NOT NULL DEFAULT 30,
  completed_minutes REAL DEFAULT 0,
  completed         INTEGER DEFAULT 0
);
