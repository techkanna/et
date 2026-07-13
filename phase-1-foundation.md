# Phase 1 — Foundation

> **Goal**: Build the core application shell — database, user profile, basic AI chat, audio recording, and the home screen. By the end of this phase, you can speak to Gemma and get a spoken reply.

---

## Prerequisites

- Phase 0 complete (dev environment, AI services running, project scaffolded)

---

## 1.1 — Database Schema & ORM Layer

### SQLite Setup with `better-sqlite3`

Create `lib/db/index.ts` — a singleton database connection.

### Tables to Create

Create a migration file `lib/db/migrations/001_initial.sql`:

```sql
-- User (single-user app, but still a table for future flexibility)
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  native_language TEXT DEFAULT 'Tamil',
  english_level TEXT DEFAULT 'intermediate', -- beginner | intermediate | advanced
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
  mode          TEXT NOT NULL DEFAULT 'free', -- free | daily | interview | roleplay | etc.
  scenario      TEXT, -- JSON for roleplay context
  started_at    TEXT DEFAULT (datetime('now')),
  ended_at      TEXT,
  duration_seconds INTEGER DEFAULT 0,
  summary       TEXT -- rolling conversation summary
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id),
  role            TEXT NOT NULL, -- 'user' | 'assistant'
  text            TEXT NOT NULL,
  audio_path      TEXT, -- path to saved audio file
  grammar_score   REAL,
  pronunciation_score REAL,
  fluency_score   REAL,
  created_at      TEXT DEFAULT (datetime('now'))
);

-- Daily Goals
CREATE TABLE IF NOT EXISTS daily_goals (
  date              TEXT PRIMARY KEY, -- YYYY-MM-DD
  user_id           INTEGER NOT NULL REFERENCES users(id),
  goal_minutes      INTEGER NOT NULL DEFAULT 30,
  completed_minutes REAL DEFAULT 0,
  completed         INTEGER DEFAULT 0 -- boolean
);
```

### Data Access Layer

Create typed query functions in `lib/db/queries/`:

- `users.ts` — `getUser()`, `createUser()`, `updateUser()`
- `conversations.ts` — `createConversation()`, `getConversation()`, `listConversations()`, `endConversation()`
- `messages.ts` — `addMessage()`, `getMessages()`, `getRecentMessages(limit)`
- `daily-goals.ts` — `getTodayGoal()`, `updateGoalProgress()`

> [!TIP]
> Use Zod schemas to validate data going in and out of the database. Define them in `lib/db/schema.ts`.

---

## 1.2 — Onboarding Flow

### Purpose

First-time setup. The user enters:

1. **Name** — "What should I call you?"
2. **English Level** — Beginner / Intermediate / Advanced (with examples)
3. **Learning Goal** — Free text ("Speak confidently in IT meetings")
4. **Daily Target** — 15 / 30 / 45 / 60 minutes

### Implementation

- `features/onboarding/` — multi-step form component
- Stores result in the `users` table
- After completion, redirects to the home screen
- Check on app load: if no user exists → show onboarding

### UI

- Clean, full-screen wizard
- Progress dots at the top
- Animated transitions between steps (Framer Motion)
- Warm, encouraging tone in copy

---

## 1.3 — Home Screen

### Layout

```
┌────────────────────────────┐
│  Good Evening, Senthil!    │
│                            │
│  🔥 18 Day Streak          │
│                            │
│  ┌──────────────────────┐  │
│  │  Today's Goal         │  │
│  │  ████████░░░ 24/30min │  │
│  └──────────────────────┘  │
│                            │
│  ┌──────────────────────┐  │
│  │  ★ 520 Credits        │  │
│  └──────────────────────┘  │
│                            │
│  ┌──────────────────────┐  │
│  │  ▶ Continue Talking   │  │
│  └──────────────────────┘  │
│                            │
│  ┌──────────────────────┐  │
│  │  🎭 Start Role Play   │  │
│  └──────────────────────┘  │
│                            │
│  More options...           │
│  (Daily Challenge,         │
│   Vocabulary, Mistakes,    │
│   Progress)                │
└────────────────────────────┘
```

### Implementation

- `app/page.tsx` — Home screen
- `components/home/` — StreakCard, GoalProgress, QuickActions
- Fetch user data via API route: `app/api/user/route.ts`
- Fetch today's goal via: `app/api/daily-goal/route.ts`
- Time-aware greeting (Good Morning/Afternoon/Evening)

---

## 1.4 — AI Integration Layer

### Architecture

The app talks to AI services through an abstraction layer in `lib/ai/`:

```
lib/ai/
  llm.ts        — Chat completions (Gemma)
  stt.ts        — Speech-to-text (Whisper)
  tts.ts        — Text-to-speech (Kokoro/Piper)
  types.ts      — Shared types
```

### LLM Client (`lib/ai/llm.ts`)

```typescript
// OpenAI-compatible client
// Sends messages to Gemma via Ollama's /v1/chat/completions
// Supports structured JSON output via response_format

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function chat(messages: ChatMessage[]): Promise<TeacherResponse>
```

### STT Client (`lib/ai/stt.ts`)

```typescript
// Sends audio blob to Faster-Whisper server
// Returns transcript text

async function transcribe(audioBlob: Blob): Promise<string>
```

### TTS Client (`lib/ai/tts.ts`)

```typescript
// Sends text to TTS server
// Returns audio buffer

async function synthesize(text: string): Promise<ArrayBuffer>
```

### Environment-based Configuration

All URLs come from env vars set in Phase 0. This means the same code works on MacBook (pointing to local Ollama) and on the LXC (pointing to GPU-accelerated services).

---

## 1.5 — System Prompt & Structured Response

### System Prompt (`lib/prompt/system.ts`)

The system prompt defines ET's personality and behavior:

```
You are ET, a private English speaking coach.

Rules:
- Never switch to another language
- Be encouraging and patient
- Never overwhelm with too much correction at once
- Correct naturally within the conversation
- Never give long lectures
- Ask follow-up questions to keep the conversation going
- Keep replies under 80 words
- Speak conversationally, like a friendly teacher
- Remember and reference previous mistakes when relevant
- Adapt difficulty to the learner's level

You MUST respond in valid JSON with this schema:
{
  "teacherReply": "Your conversational response",
  "grammarCorrections": [{"wrong": "...", "correct": "...", "explanation": "..."}],
  "newVocabulary": [{"word": "...", "meaning": "..."}],
  "scores": {"grammar": 0-100, "fluency": 0-100, "confidence": 0-100}
}
```

### Response Parser (`lib/ai/parser.ts`)

- Parse the JSON response from Gemma
- Validate with Zod
- Extract: `teacherReply`, `grammarCorrections`, `newVocabulary`, `scores`
- Fallback: if JSON parsing fails, treat the entire response as `teacherReply`

---

## 1.6 — Audio Recording (Client-Side)

### Browser Audio Recording (`lib/audio/recorder.ts`)

Using the MediaRecorder API:

- Request microphone permission
- Record audio as WebM/Opus (good compression, browser-native)
- Provide start/stop/pause controls
- Return audio as a `Blob`

### Voice Activity Detection (Simple)

- Use the Web Audio API `AnalyserNode` to detect silence
- Auto-stop recording after 2 seconds of silence (configurable)
- Show a live waveform visualization during recording

### Audio Playback

- Play back AI responses using the `<audio>` element or `AudioContext`
- Show a waveform or simple progress indicator

---

## 1.7 — Speaking Session UI

### The Core Experience

This is the most important screen. It should feel like a **voice call**, not a chat app.

```
┌────────────────────────────┐
│         ET Avatar          │
│      (animated circle)     │
│                            │
│     "Listening..."         │
│                            │
│    ≋≋≋≋≋≋≋≋≋≋≋≋≋≋         │
│    (wave animation)        │
│                            │
│   Live transcript below    │
│                            │
│  ┌────────────────────┐    │
│  │  🎤 Hold to Speak  │    │
│  └────────────────────┘    │
│                            │
│  ┌────┐          ┌────┐   │
│  │ ⏹  │          │ 📝  │   │
│  │Stop│          │Text│   │
│  └────┘          └────┘   │
│                            │
│  Conversation timeline     │
│  (scrollable)              │
└────────────────────────────┘
```

### Implementation

- `features/speaking/` — the session components
- `SpeakingSession.tsx` — main container
- `AvatarAnimation.tsx` — animated circle that pulses when AI is "speaking"
- `WaveformVisualizer.tsx` — live audio waveform
- `TranscriptDisplay.tsx` — shows live/recent transcript
- `ConversationTimeline.tsx` — scrollable history of the session

### Conversation Flow (Full Pipeline)

```
User taps "Hold to Speak"
  ↓
MediaRecorder starts
  ↓
User speaks → waveform animates
  ↓
User releases → recording stops
  ↓
Audio blob sent to API: POST /api/conversation/message
  ↓
Server: Audio → STT (Whisper) → transcript
  ↓
Server: Build context (system prompt + recent messages + user profile)
  ↓
Server: Transcript → LLM (Gemma) → structured JSON response
  ↓
Server: Parse response → save message + corrections + vocabulary
  ↓
Server: Teacher reply text → TTS → audio buffer
  ↓
Response sent to client: { teacherReply, audioUrl, scores }
  ↓
Client: Play audio → show transcript → update UI
```

### API Routes

- `POST /api/conversation/start` — create a new conversation, return `conversationId`
- `POST /api/conversation/message` — accept audio, return teacher response + audio
- `POST /api/conversation/end` — end conversation, calculate session summary

---

## 1.8 — Conversation Persistence

### Save Everything

Every message exchange saves:

- User's transcript (from STT)
- User's audio file (to `storage/audio/`)
- AI's reply text
- AI's audio file (to `storage/audio/`)
- Scores (grammar, fluency, confidence)
- Grammar corrections (to `messages` table metadata, or a separate corrections column)

### Audio File Storage

```
storage/
  audio/
    conversations/
      {conversation_id}/
        user_{message_id}.webm
        ai_{message_id}.mp3
```

---

## 1.9 — Basic Navigation

### Routes

| Route | Page |
|-------|------|
| `/` | Home screen |
| `/onboarding` | First-time setup |
| `/speak` | Speaking session |
| `/speak?mode=free` | Free conversation |

### Bottom Navigation (for future phases)

```
Home | Speak | Progress | Profile
```

For now, just Home and Speak are functional.

---

## Verification Checklist

- [ ] Database creates successfully with all Phase 1 tables
- [ ] Onboarding flow works and creates a user record
- [ ] Home screen displays user data, streak, goal progress
- [ ] Can start a new conversation from the home screen
- [ ] Microphone recording works in the browser
- [ ] Audio is sent to the server and transcribed by Whisper
- [ ] Transcript is sent to Gemma and a structured response is returned
- [ ] Teacher reply is converted to speech by TTS
- [ ] Audio response plays in the browser
- [ ] Messages are saved to the database
- [ ] Audio files are saved to the storage directory
- [ ] Conversation timeline shows the exchange history
- [ ] Can end a conversation and return to the home screen

---

## What This Phase Does NOT Include

- ❌ Grammar/vocabulary extraction and tracking (Phase 2)
- ❌ Context summarization (Phase 2)
- ❌ Long-term learner memory (Phase 2)
- ❌ Role-play engine (Phase 3)
- ❌ Scoring and scorecards (Phase 3)
- ❌ Credits, XP, gamification (Phase 4)
- ❌ Rich animations and polish (Phase 5)

---

## Estimated Time

| Task | Time |
|------|------|
| Database schema + queries | 3–4 hours |
| Onboarding flow | 2–3 hours |
| Home screen UI | 3–4 hours |
| AI integration layer | 3–4 hours |
| System prompt + response parsing | 2–3 hours |
| Audio recording + playback | 3–4 hours |
| Speaking session UI | 4–6 hours |
| API routes (conversation flow) | 3–4 hours |
| Conversation persistence | 2–3 hours |
| Testing + bug fixes | 3–4 hours |
| **Total** | **28–39 hours** |
