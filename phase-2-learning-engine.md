# Phase 2 — Learning Engine

> **Goal**: Transform ET from a basic voice chat into an intelligent English coach that tracks your progress, remembers your weaknesses, and builds context efficiently. This is the phase where ET starts "learning about you."

---

## Prerequisites

- Phase 1 complete (working voice conversation loop with Gemma)

---

## 2.1 — Vocabulary Tracking

### New Database Table

```sql
CREATE TABLE IF NOT EXISTS vocabulary (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  word        TEXT NOT NULL,
  meaning     TEXT,
  example     TEXT,  -- example sentence from conversation
  mastery     TEXT DEFAULT 'new', -- new | learning | practicing | mastered
  mastery_score REAL DEFAULT 0, -- 0-100
  times_seen  INTEGER DEFAULT 1,
  times_used  INTEGER DEFAULT 0,
  last_seen   TEXT DEFAULT (datetime('now')),
  first_seen  TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, word)
);
```

### Vocabulary Extraction

After every AI response, extract `newVocabulary` from the structured JSON:

```json
{
  "newVocabulary": [
    { "word": "nevertheless", "meaning": "in spite of that" }
  ]
}
```

- If the word exists → increment `times_seen`, update `last_seen`
- If new → insert with `mastery = 'new'`
- If the user **uses** a tracked word → increment `times_used`, update mastery

### Mastery Progression

```
new → learning → practicing → mastered

Triggers:
  new → learning:      seen 3+ times
  learning → practicing: used 3+ times by the learner
  practicing → mastered:  used 8+ times with correct grammar
```

### Spaced Repetition Logic

In `lib/scoring/vocabulary.ts`:

- Track each word's mastery score (0–100)
- Words that haven't been seen recently get lower scores
- AI is prompted to introduce words that need practice:

```
Vocabulary to practice today:
- "nevertheless" (mastery: 45%, last used 3 days ago)
- "accommodate" (mastery: 22%, last used 5 days ago)
```

This goes into the context builder (section 2.5).

---

## 2.2 — Grammar Mistake Tracking

### New Database Table

```sql
CREATE TABLE IF NOT EXISTS mistakes (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL REFERENCES users(id),
  conversation_id INTEGER REFERENCES conversations(id),
  message_id      INTEGER REFERENCES messages(id),
  type            TEXT NOT NULL, -- 'grammar' | 'vocabulary' | 'pronunciation'
  wrong_text      TEXT NOT NULL,
  correct_text    TEXT NOT NULL,
  explanation     TEXT,
  category        TEXT, -- 'articles' | 'tense' | 'subject-verb' | 'preposition' | etc.
  resolved        INTEGER DEFAULT 0, -- boolean: has the user corrected this pattern?
  times_repeated  INTEGER DEFAULT 1,
  created_at      TEXT DEFAULT (datetime('now'))
);
```

### Grammar Extraction

From the structured AI response:

```json
{
  "grammarCorrections": [
    {
      "wrong": "He go to school",
      "correct": "He goes to school",
      "explanation": "Third-person singular needs 'goes'",
      "category": "subject-verb-agreement"
    }
  ]
}
```

### Pattern Detection

In `lib/scoring/grammar.ts`:

- Group mistakes by `category`
- Track how often each category appears
- Mark a mistake as `resolved` if the user stops making it (3 consecutive conversations without it)
- Surface the top 3 recurring mistake patterns to the AI

### Non-Interrupting Feedback (Draft Plan Principle)

Grammar corrections are NOT shown during the conversation. They are:

1. Saved silently during the session
2. Shown in the **Session Review** (section 2.6)
3. Fed back into the AI context for future conversations

---

## 2.3 — Long-Term Learner Memory

### New Database Table

```sql
CREATE TABLE IF NOT EXISTS learner_memory (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  category    TEXT NOT NULL, -- 'strength' | 'weakness' | 'preference' | 'goal' | 'fact'
  key         TEXT NOT NULL,
  value       TEXT NOT NULL,
  confidence  REAL DEFAULT 0.5, -- 0-1, how confident we are in this memory
  updated_at  TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, category, key)
);
```

### What Gets Stored

```
Weaknesses:
  past_tense → "Frequently uses 'goed' instead of 'went'"
  articles → "Often drops 'the' before nouns"
  th_pronunciation → "Pronounces 'th' as 't'"

Strengths:
  present_simple → "Good command of present simple tense"
  vocabulary_range → "Uses varied vocabulary for daily topics"

Preferences:
  topics → "Enjoys talking about technology and cooking"
  speed → "Prefers slower-paced conversation"

Goals:
  primary → "Speak confidently in IT meetings"
  
Facts:
  job → "Works as a software developer"
  native_language → "Tamil"
```

### Memory Update Mechanism

After every conversation, add a step to the AI pipeline:

```
Existing conversation transcript
  ↓
Prompt: "Based on this conversation, what did you learn about the student? 
         Update the learner profile."
  ↓
Structured response:
{
  "memoryUpdates": [
    { "category": "weakness", "key": "articles", "value": "Still dropping 'the'", "confidence": 0.8 },
    { "category": "strength", "key": "vocabulary", "value": "Used 'nevertheless' correctly", "confidence": 0.7 }
  ]
}
  ↓
Upsert into learner_memory table
```

> [!IMPORTANT]
> Memory updates happen at conversation END, not after every message. This keeps inference costs manageable and avoids noisy updates.

---

## 2.4 — Conversation Summarization

### Why

The draft plan correctly identifies: don't send the whole history every time. Instead, maintain a rolling summary.

### Summarization Strategy

Every **10 messages** (configurable), summarize the conversation so far:

```
Recent 10 messages
  ↓
Prompt: "Summarize this conversation in 2-3 sentences, 
         focusing on what was practiced and what mistakes were made."
  ↓
Summary stored in conversations.summary column
  ↓
Old messages beyond the last 8 are no longer included in context
```

### Implementation

In `lib/ai/summarizer.ts`:

```typescript
async function summarizeConversation(
  messages: Message[], 
  existingSummary: string | null
): Promise<string>
```

This is called by the conversation API route when `messageCount % 10 === 0`.

### Context Window Management

The context sent to Gemma for each turn:

```
System Prompt                          (~300 tokens)
+ User Profile (name, level, goal)     (~50 tokens)
+ Learner Memory (top weaknesses)      (~100 tokens)
+ Conversation Summary                 (~100 tokens)
+ Last 8 Messages                      (~400 tokens)
+ Vocabulary to Practice               (~50 tokens)
+ Roleplay Context (if applicable)     (~50 tokens)
─────────────────────────────────────
Total: ~1,050 tokens
```

This keeps context small, even for hour-long sessions.

---

## 2.5 — Context Builder

### Central Context Assembly

Create `lib/prompt/context-builder.ts`:

```typescript
async function buildContext(
  conversationId: number,
  userId: number
): Promise<ChatMessage[]> {
  const user = getUser(userId);
  const memory = getLearnerMemory(userId);
  const summary = getConversationSummary(conversationId);
  const recentMessages = getRecentMessages(conversationId, 8);
  const vocabularyToPractice = getVocabularyToPractice(userId, 5);
  const recentMistakes = getRecentMistakes(userId, 5);
  
  return [
    { role: 'system', content: buildSystemPrompt(user, memory, vocabularyToPractice, recentMistakes) },
    ...(summary ? [{ role: 'system', content: `Conversation so far: ${summary}` }] : []),
    ...recentMessages.map(m => ({ role: m.role, content: m.text }))
  ];
}
```

This is the function called before every LLM request. It replaces the naive "send everything" approach.

---

## 2.6 — Session Review Screen

### Shown at Conversation End

When the user ends a session, show a review:

```
┌────────────────────────────┐
│     Session Complete! 🎉   │
│                            │
│  Duration: 12 minutes      │
│                            │
│  ┌──────────────────────┐  │
│  │ Grammar        82/100│  │
│  │ ████████████░░░░░░░░ │  │
│  │                      │  │
│  │ Fluency        75/100│  │
│  │ ██████████░░░░░░░░░░ │  │
│  │                      │  │
│  │ Vocabulary     69/100│  │
│  │ █████████░░░░░░░░░░░ │  │
│  │                      │  │
│  │ Confidence     80/100│  │
│  │ ███████████░░░░░░░░░ │  │
│  └──────────────────────┘  │
│                            │
│  💪 Biggest Improvement    │
│  Using Present Perfect     │
│                            │
│  📝 Needs Practice         │
│  Articles (a/an/the)       │
│                            │
│  📚 New Words: 8           │
│  🔄 Repeated Mistakes: 3   │
│                            │
│  Corrections:              │
│  ✗ "He go to school"       │
│  ✓ "He goes to school"     │
│  → 3rd person singular     │
│                            │
│  [Continue] [Home]         │
└────────────────────────────┘
```

### Implementation

- `features/speaking/SessionReview.tsx`
- API route: `POST /api/conversation/end` returns session summary
- The summary is generated by Gemma:

```json
{
  "sessionSummary": {
    "overallScore": 77,
    "biggestImprovement": "Using Present Perfect",
    "needsPractice": "Articles",
    "newWordsCount": 8,
    "repeatedMistakes": 3,
    "homework": "Practice using articles in sentences about your daily routine"
  }
}
```

---

## 2.7 — Progress Dashboard (Basic)

### New Route: `/progress`

A simple dashboard showing trends:

- **Speaking time** — minutes per day (bar chart, last 7 days)
- **Grammar score** — average per session (line chart, last 7 days)
- **Vocabulary growth** — total words tracked, words mastered
- **Streak** — current and longest

### Implementation

- `features/progress/ProgressDashboard.tsx`
- Use a lightweight charting library (e.g., `recharts` or custom SVG)
- API route: `GET /api/progress` — returns aggregated stats

### Data Aggregation

Create `lib/db/queries/progress.ts`:

```typescript
function getWeeklyStats(userId: number): WeeklyStats
function getVocabularyStats(userId: number): VocabStats
function getMistakeCategories(userId: number): MistakeBreakdown
```

---

## 2.8 — Mistakes Review Screen

### New Route: `/mistakes`

Shows all tracked mistakes, grouped by category:

```
┌────────────────────────────┐
│  Your Mistakes             │
│                            │
│  Articles (12 times)       │
│  ├─ "I went to office"     │
│  │  → "I went to THE office│
│  ├─ "He is good boy"       │
│  │  → "He is A good boy"   │
│  │                         │
│  Tense (8 times)           │
│  ├─ "Yesterday I go..."    │
│  │  → "Yesterday I went.." │
│  │                         │
│  [Resolved ✓] [Active ✗]  │
└────────────────────────────┘
```

### Implementation

- `features/mistakes/MistakesReview.tsx`
- API route: `GET /api/mistakes` — grouped by category, sorted by frequency
- Toggle between active and resolved mistakes

---

## 2.9 — Vocabulary Review Screen

### New Route: `/vocabulary`

Shows all tracked vocabulary:

```
┌────────────────────────────┐
│  Your Vocabulary           │
│                            │
│  Filter: [All] [New]       │
│  [Learning] [Mastered]     │
│                            │
│  nevertheless              │
│  mastery: ██████░░ 62%     │
│  "in spite of that"        │
│  Used 4 times              │
│                            │
│  accommodate               │
│  mastery: ███░░░░░ 35%     │
│  "to provide space for"    │
│  Used 2 times              │
│                            │
│  Total: 47 words tracked   │
│  Mastered: 12              │
└────────────────────────────┘
```

### Implementation

- `features/vocabulary/VocabularyReview.tsx`
- API route: `GET /api/vocabulary` — with filter by mastery level

---

## Verification Checklist

- [ ] Grammar corrections are extracted and saved after each AI response
- [ ] Vocabulary is tracked and mastery levels update correctly
- [ ] Learner memory is updated at the end of each conversation
- [ ] Conversation summarization triggers every 10 messages
- [ ] Context builder assembles the right context (profile + memory + summary + recent messages)
- [ ] Context size stays under ~1,200 tokens even for long conversations
- [ ] Session review screen shows scores, corrections, and summary
- [ ] Progress dashboard shows weekly trends with charts
- [ ] Mistakes review screen lists all mistakes grouped by category
- [ ] Vocabulary review screen shows all words with mastery levels
- [ ] Navigation works between all new routes

---

## Estimated Time

| Task | Time |
|------|------|
| Vocabulary tracking (DB + extraction + mastery) | 4–5 hours |
| Grammar mistake tracking | 3–4 hours |
| Long-term learner memory | 3–4 hours |
| Conversation summarization | 2–3 hours |
| Context builder | 2–3 hours |
| Session review screen | 3–4 hours |
| Progress dashboard | 4–5 hours |
| Mistakes review screen | 2–3 hours |
| Vocabulary review screen | 2–3 hours |
| Testing + bug fixes | 3–4 hours |
| **Total** | **28–38 hours** |
