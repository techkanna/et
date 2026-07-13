# Phase 3 — Coaching & Role Play

> **Goal**: Turn ET into an active coach that runs structured lessons, role-play scenarios, daily challenges, and provides detailed speaking scorecards. This is where ET stops being reactive and starts being proactive.

---

## Prerequisites

- Phase 2 complete (vocabulary tracking, grammar extraction, learner memory, context builder)

---

## 3.1 — Speaking Modes System

### Architecture

Create a **mode engine** that configures the AI's behavior based on the selected speaking mode.

```
lib/modes/
  index.ts          — mode registry
  types.ts          — shared types
  free.ts           — free conversation
  daily-english.ts  — 15-minute structured lesson
  interview.ts      — mock interview
  roleplay.ts       — generic roleplay engine
  ielts.ts          — IELTS speaking simulation
  debate.ts         — debate mode
  storytelling.ts   — collaborative storytelling
  casual.ts         — casual friend chat
```

### Mode Interface

```typescript
interface SpeakingMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  estimatedMinutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'adaptive';
  systemPromptExtension: string;  // added to the base system prompt
  openingMessage: string;          // first message from ET
  completionCriteria?: string;     // when is the session "done"?
}
```

### Mode Selection Screen

New route: `/speak/modes`

```
┌────────────────────────────┐
│  Choose a Mode             │
│                            │
│  ┌──────────────────────┐  │
│  │ 💬 Free Conversation  │  │
│  │ Talk about anything   │  │
│  └──────────────────────┘  │
│                            │
│  ┌──────────────────────┐  │
│  │ 📚 Daily English      │  │
│  │ 15-min structured     │  │
│  └──────────────────────┘  │
│                            │
│  ┌──────────────────────┐  │
│  │ 🎭 Role Play          │  │
│  │ Restaurant, Airport...│  │
│  └──────────────────────┘  │
│                            │
│  ┌──────────────────────┐  │
│  │ 💼 Interview Practice │  │
│  │ Mock job interviews   │  │
│  └──────────────────────┘  │
│                            │
│  ┌──────────────────────┐  │
│  │ 📝 IELTS Speaking     │  │
│  │ Full exam simulation  │  │
│  └──────────────────────┘  │
│                            │
│  More: Debate, Story,      │
│  Casual Friend             │
└────────────────────────────┘
```

---

## 3.2 — Role-Play Engine

### Scenario Database Table

```sql
CREATE TABLE IF NOT EXISTS scenarios (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL, -- 'restaurant' | 'airport' | 'office' | 'travel' | etc.
  description TEXT NOT NULL,
  ai_role     TEXT NOT NULL, -- "Waiter at an Italian restaurant"
  user_role   TEXT NOT NULL, -- "Customer ordering dinner"
  goal        TEXT NOT NULL, -- "Successfully order a meal"
  difficulty  TEXT NOT NULL DEFAULT 'intermediate',
  vocabulary_focus TEXT, -- JSON array: ["menu items", "polite requests"]
  grammar_focus TEXT,    -- JSON array: ["conditional", "polite forms"]
  opening_line TEXT NOT NULL, -- ET's first line in character
  is_custom   INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now'))
);
```

### Seed Scenarios

Pre-populate with scenarios from the draft plan:

| Scenario | AI Role | User Goal |
|----------|---------|-----------|
| Restaurant | Waiter | Order dinner naturally |
| Airport | Immigration officer | Pass through immigration |
| Office Meeting | Project manager | Present a status update |
| Customer Support | Support agent | Resolve a billing issue |
| Travel | Hotel receptionist | Check in and ask about amenities |
| Job Interview | HR interviewer | Answer common interview questions |
| Client Call | US-based client | Discuss project requirements |
| Presentation | Audience member | Deliver a 2-minute presentation |

### Role-Play Flow

```
User selects "Role Play" → sees scenario list
  ↓
User selects scenario (e.g., "Restaurant")
  ↓
Conversation starts with AI in character:
  "Welcome to La Bella Italia! Table for one, or are you expecting someone?"
  ↓
Conversation stays in character throughout
  ↓
AI tracks goal progress:
  { "goalProgress": 60, "goalHint": "You haven't ordered drinks yet" }
  ↓
When goal is achieved (or user ends):
  Session review with roleplay-specific feedback
```

### Role-Play System Prompt Extension

```
You are now role-playing as: {ai_role}
The student is: {user_role}
Their goal: {goal}
Difficulty: {difficulty}

Stay in character at all times.
Gradually guide the student toward completing their goal.
If they struggle, provide gentle hints in character.
After the conversation, provide feedback on how naturally they communicated.

Vocabulary focus: {vocabulary_focus}
Grammar focus: {grammar_focus}
```

### Custom Scenario Creator

Allow users to create custom role-play scenarios:

- Route: `/speak/roleplay/create`
- Simple form: describe the situation, AI role, user role, goal
- Saved to `scenarios` table with `is_custom = 1`

---

## 3.3 — Daily Challenge System

### Database Table

```sql
CREATE TABLE IF NOT EXISTS challenges (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  date        TEXT NOT NULL, -- YYYY-MM-DD
  user_id     INTEGER NOT NULL REFERENCES users(id),
  type        TEXT NOT NULL, -- 'vocabulary' | 'grammar' | 'speaking' | 'creative'
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  criteria    TEXT NOT NULL, -- JSON: how to evaluate completion
  reward_credits INTEGER DEFAULT 50,
  reward_xp   INTEGER DEFAULT 25,
  completed   INTEGER DEFAULT 0,
  completed_at TEXT,
  UNIQUE(date, user_id)
);
```

### Challenge Generation

Every day at first app open, generate a personalized challenge using Gemma + learner memory:

```
Prompt to Gemma:
"Based on this learner profile, generate today's daily challenge.
 
 Weaknesses: articles, past tense
 Vocabulary to practice: nevertheless, accommodate
 Level: intermediate
 
 Generate a challenge that targets their weaknesses."

Response:
{
  "type": "grammar",
  "title": "Article Master",
  "description": "Use articles (a, an, the) correctly in at least 10 sentences during today's conversation.",
  "criteria": { "type": "count", "target": "articles_correct", "minimum": 10 }
}
```

### Challenge Examples (Seeded)

For early days before personalization kicks in:

| Type | Title | Description |
|------|-------|-------------|
| vocabulary | Word Explorer | Use 10 new words in conversation |
| speaking | Marathon | Talk for 15 minutes straight |
| grammar | Tense Master | Use 5 different tenses correctly |
| creative | Storyteller | Tell a complete story about your weekend |
| creative | Describe It | Describe your hometown in detail |
| grammar | Past Perfect | Use past perfect tense 3 times |

### Challenge Tracking

During a conversation, the system tracks progress toward the daily challenge:

- After each message, check if the challenge criteria is being met
- Show progress indicator on the speaking session UI
- When completed, show a celebration animation + award credits/XP

---

## 3.4 — Pronunciation Analysis Hooks

### Current Limitation

True phoneme-level pronunciation analysis requires a dedicated speech model (e.g., wav2letter, Kaldi). This is a Phase 5+ feature.

### What We CAN Do Now

1. **Whisper confidence scores**: Faster-Whisper returns word-level confidence scores. Low confidence on a word suggests pronunciation issues.

2. **LLM-based pronunciation hints**: After STT, send the transcript to Gemma with a note:

```
"The student said: 'I want to go to the theeter'
 The STT system was uncertain about: 'theeter'
 
 Based on common pronunciation mistakes for Tamil speakers,
 what pronunciation feedback would you give?"
```

3. **Repeat-after-me exercises**: AI says a sentence → user repeats → STT transcribes → compare expected vs actual text.

### Implementation

In `lib/scoring/pronunciation.ts`:

```typescript
interface PronunciationHint {
  word: string;
  issue: string;  // "TH sound", "vowel", "stress"
  suggestion: string;
  exercise: string; // "Try saying: 'the three trees' slowly"
}

function analyzePronunciation(
  expectedText: string,
  transcribedText: string,
  wordConfidences: WordConfidence[]
): PronunciationHint[]
```

---

## 3.5 — Speaking Scorecards

### Per-Message Scoring

Every user message gets scores from the AI:

```json
{
  "scores": {
    "grammar": 85,
    "fluency": 72,
    "confidence": 78,
    "vocabulary": 65,
    "pronunciation": 70
  }
}
```

### Session Scorecard (Enhanced from Phase 2)

At session end, generate a detailed scorecard:

```
┌────────────────────────────────────────┐
│          Session Scorecard             │
│                                        │
│  Overall: ★★★★☆ (78/100)              │
│                                        │
│  Grammar       ████████████░░░  85     │
│  Fluency       █████████░░░░░░  72     │
│  Vocabulary    ████████░░░░░░░  65     │
│  Confidence    ██████████░░░░░  78     │
│  Pronunciation ████████░░░░░░░  70     │
│                                        │
│  ↑ Improved: Grammar (+5 from last)    │
│  ↓ Declined: Vocabulary (-3)           │
│                                        │
│  🏆 Best moment:                       │
│  "You used 'nevertheless' perfectly!"  │
│                                        │
│  📝 Homework:                          │
│  Practice articles with these          │
│  sentences: ...                        │
│                                        │
│  🎯 Next session focus:                │
│  Articles & present perfect tense      │
└────────────────────────────────────────┘
```

### Score History

Store per-session scores:

```sql
CREATE TABLE IF NOT EXISTS session_scores (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id),
  user_id         INTEGER NOT NULL REFERENCES users(id),
  grammar         REAL,
  fluency         REAL,
  vocabulary      REAL,
  confidence      REAL,
  pronunciation   REAL,
  overall         REAL,
  duration_seconds INTEGER,
  message_count   INTEGER,
  created_at      TEXT DEFAULT (datetime('now'))
);
```

---

## 3.6 — Personalized Homework

### After Each Session

Gemma generates homework based on the session:

```json
{
  "homework": {
    "focus": "Articles",
    "exercises": [
      "Fill in the blanks: 'I went to ___ office yesterday.'",
      "Correct this: 'He is good boy.'",
      "Practice saying: 'The book is on the table.'"
    ],
    "practiceWords": ["nevertheless", "accommodate"],
    "suggestedMode": "daily-english",
    "suggestedScenario": "office-meeting"
  }
}
```

### Homework Storage

```sql
CREATE TABLE IF NOT EXISTS homework (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL REFERENCES users(id),
  conversation_id INTEGER REFERENCES conversations(id),
  focus_area      TEXT NOT NULL,
  exercises       TEXT NOT NULL, -- JSON array
  completed       INTEGER DEFAULT 0,
  created_at      TEXT DEFAULT (datetime('now'))
);
```

### Homework Review

- Show pending homework on the home screen
- Mark as completed when the user practices the suggested area
- Feed homework results into learner memory

---

## 3.7 — Daily English Lesson Mode

### Structured 15-Minute Lesson

Unlike free conversation, this mode follows a structure:

```
Part 1 (3 min): Warm-up
  "How was your day? Tell me one thing that happened."

Part 2 (5 min): Today's Topic
  Based on learner memory weaknesses
  "Today we're going to practice using articles."

Part 3 (5 min): Practice Exercises
  Role-play or sentence construction targeting the topic

Part 4 (2 min): Review
  Quick summary of what was practiced
  Homework assignment
```

### Implementation

The `daily-english` mode uses a state machine:

```typescript
interface LessonState {
  part: 'warmup' | 'topic' | 'practice' | 'review';
  partStartedAt: number;
  topicFocus: string;
  exercisesCompleted: number;
}
```

The system prompt dynamically adjusts based on the current part.

---

## 3.8 — IELTS Speaking Simulation

### Full IELTS Speaking Test

Three parts, timed:

```
Part 1 (4-5 min): Introduction & Interview
  General questions about familiar topics

Part 2 (3-4 min): Long Turn
  Topic card given, 1 min prep, 1-2 min speak

Part 3 (4-5 min): Discussion
  Abstract questions related to Part 2 topic
```

### IELTS-Specific Scoring

```json
{
  "ieltsScores": {
    "fluencyAndCoherence": 6.5,
    "lexicalResource": 6.0,
    "grammaticalRangeAndAccuracy": 6.5,
    "pronunciation": 6.0,
    "overallBand": 6.5
  }
}
```

---

## Verification Checklist

- [ ] Mode selection screen shows all available modes
- [ ] Free conversation, daily English, and casual friend modes work
- [ ] Role-play scenarios load and the AI stays in character
- [ ] Custom role-play creation works
- [ ] Daily challenge generates based on learner profile
- [ ] Challenge progress is tracked during conversation
- [ ] Pronunciation hints are generated from STT confidence scores
- [ ] Session scorecards show all 5 metrics with comparisons to previous sessions
- [ ] Score history is saved and visible on the progress dashboard
- [ ] Homework is generated and shown on the home screen
- [ ] Daily English lesson follows the 4-part structure
- [ ] IELTS simulation runs all 3 parts with IELTS-style scoring
- [ ] All new routes navigate correctly

---

## Estimated Time

| Task | Time |
|------|------|
| Speaking modes system + registry | 3–4 hours |
| Mode selection UI | 2–3 hours |
| Role-play engine + seed scenarios | 5–6 hours |
| Custom scenario creator | 2–3 hours |
| Daily challenge system | 4–5 hours |
| Pronunciation analysis hooks | 3–4 hours |
| Speaking scorecards (enhanced) | 3–4 hours |
| Personalized homework | 2–3 hours |
| Daily English lesson mode | 3–4 hours |
| IELTS speaking simulation | 3–4 hours |
| Testing + bug fixes | 4–5 hours |
| **Total** | **34–45 hours** |
