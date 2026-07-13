# Phase 4 — Gamification & Motivation

> **Goal**: Make ET addictive (in a good way). Add credits, XP, levels, streaks, achievements, and daily goals so the user is motivated to practice every single day. Inspired by Duolingo's retention mechanics, but for speaking practice.

---

## Prerequisites

- Phase 3 complete (speaking modes, scorecards, daily challenges)

---

## 4.1 — Credits System

### How Credits Work

Credits are the in-app currency. They reward consistent practice.

| Action | Credits |
|--------|---------|
| Complete daily goal (30 min) | +50 |
| Perfect grammar in a session | +20 |
| Perfect pronunciation in a sentence | +25 |
| 7-day streak bonus | +150 |
| 30-day streak bonus | +500 |
| Use a new vocabulary word correctly | +10 |
| Complete a daily challenge | +50 |
| Complete a role-play scenario | +30 |
| First conversation of the day | +15 |

### Credits Table (Already in Phase 1)

Extend with a transaction log:

```sql
CREATE TABLE IF NOT EXISTS credit_transactions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  amount      INTEGER NOT NULL, -- positive = earned, negative = spent
  reason      TEXT NOT NULL,
  source_type TEXT, -- 'conversation' | 'challenge' | 'streak' | 'achievement'
  source_id   INTEGER, -- FK to the source entity
  created_at  TEXT DEFAULT (datetime('now'))
);
```

### Credit Awarding Logic

In `lib/gamification/credits.ts`:

```typescript
async function awardCredits(userId: number, amount: number, reason: string, source?: { type: string, id: number }): Promise<void>

async function checkAndAwardSessionCredits(userId: number, sessionScores: SessionScores): Promise<CreditAward[]>
```

Credits are checked and awarded at:
1. End of each conversation session
2. Daily goal completion check
3. Streak milestone check
4. Challenge completion

### Credits Display

- Show on home screen (already in Phase 1 layout)
- Show credit animations when earned ("+50 🪙" floating up)
- Credit history accessible from profile

---

## 4.2 — XP & Leveling System

### XP Earning

XP is earned alongside credits but represents overall progress:

| Action | XP |
|--------|-----|
| Every minute of speaking practice | +5 |
| Every message sent | +2 |
| Every grammar correction reviewed | +3 |
| Every new vocabulary word encountered | +5 |
| Session completion | +20 |

### Levels

```
Level 1:  Beginner          0 - 100 XP
Level 2:  Starter           100 - 300 XP
Level 3:  Learner           300 - 600 XP
Level 4:  Speaker           600 - 1,000 XP
Level 5:  Communicator      1,000 - 1,500 XP
Level 6:  Conversationalist 1,500 - 2,500 XP
Level 7:  Fluent Speaker    2,500 - 4,000 XP
Level 8:  Advanced          4,000 - 6,000 XP
Level 9:  Expert            6,000 - 9,000 XP
Level 10: Master            9,000+ XP
```

### Database

```sql
-- XP is tracked on the users table (already has xp column)
-- Add level calculation as a derived field

CREATE TABLE IF NOT EXISTS xp_transactions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  amount      INTEGER NOT NULL,
  reason      TEXT NOT NULL,
  created_at  TEXT DEFAULT (datetime('now'))
);
```

### Level-Up Animation

When the user levels up, show a celebratory animation:
- Full-screen modal with confetti
- New level badge
- Unlocked features (if any)

---

## 4.3 — Streak System

### Streak Rules

- A streak day is counted when the user completes their daily goal
- Missing a day resets the streak to 0
- Streak milestones award bonus credits

### Streak Milestones

| Streak | Reward | Achievement |
|--------|--------|-------------|
| 3 days | +50 credits | "Getting Started" |
| 7 days | +150 credits | "One Week Strong" |
| 14 days | +300 credits | "Two Week Warrior" |
| 30 days | +500 credits | "Monthly Master" |
| 60 days | +1,000 credits | "Dedicated Learner" |
| 100 days | +2,000 credits | "Century Club" |
| 365 days | +10,000 credits | "Year of English" |

### Streak Freeze (Future)

Allow users to spend credits to freeze their streak (prevent reset for 1 missed day). Cost: 200 credits.

### Implementation

In `lib/gamification/streak.ts`:

```typescript
function checkStreak(userId: number): StreakStatus
function updateStreak(userId: number): StreakUpdate
function getStreakMilestones(streak: number): Milestone[]
```

### Streak Display

- 🔥 icon on home screen with day count
- Flame animation grows with longer streaks (small flame → raging fire)
- Streak calendar view (like GitHub contribution graph)

---

## 4.4 — Achievements System

### Achievement Categories

#### Speaking Milestones
| Achievement | Criteria | Icon |
|-------------|----------|------|
| First Words | Complete your first conversation | 🎤 |
| Talkative | Speak for 100 total minutes | 💬 |
| Chatterbox | Speak for 1,000 total minutes | 🗣️ |
| Marathon Speaker | Speak for 5,000 total minutes | 🏃 |

#### Streak Achievements
| Achievement | Criteria | Icon |
|-------------|----------|------|
| Getting Started | 3-day streak | 🌱 |
| One Week Strong | 7-day streak | 💪 |
| Monthly Master | 30-day streak | 🏅 |
| Century Club | 100-day streak | 🏆 |

#### Learning Achievements
| Achievement | Criteria | Icon |
|-------------|----------|------|
| Word Collector | Learn 50 vocabulary words | 📚 |
| Vocabulary Master | Master 100 vocabulary words | 🎓 |
| Grammar Guardian | 5 sessions with no grammar mistakes | ✅ |
| Perfect Score | Get 95+ on all metrics in one session | ⭐ |

#### Mode Achievements
| Achievement | Criteria | Icon |
|-------------|----------|------|
| Role Player | Complete 10 role-play scenarios | 🎭 |
| Interview Ready | Complete 5 interview practice sessions | 💼 |
| IELTS Prep | Complete 3 IELTS simulations | 📝 |
| Storyteller | Complete 5 storytelling sessions | 📖 |

### Database

```sql
CREATE TABLE IF NOT EXISTS achievements (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  key         TEXT NOT NULL, -- unique achievement identifier
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  icon        TEXT NOT NULL,
  category    TEXT NOT NULL,
  unlocked    INTEGER DEFAULT 0,
  unlocked_at TEXT,
  progress    REAL DEFAULT 0, -- 0-1 progress toward unlocking
  target      REAL DEFAULT 1, -- target value for completion
  UNIQUE(user_id, key)
);
```

### Achievement Checking

In `lib/gamification/achievements.ts`:

- Run achievement checks after every session end
- Check milestones against current stats
- On unlock: show toast notification with animation + award bonus credits

### Achievement Display

New route: `/achievements`

```
┌────────────────────────────┐
│  Your Achievements         │
│                            │
│  Unlocked (12/24)          │
│                            │
│  🏆 Monthly Master         │
│  30-day streak! ✓          │
│                            │
│  📚 Word Collector          │
│  Learn 50 words ✓          │
│                            │
│  ⭐ Perfect Score           │
│  ████████░░ 80%            │
│  (Not yet unlocked)        │
│                            │
│  🎭 Role Player             │
│  ██████░░░░ 60% (6/10)    │
│  (Not yet unlocked)        │
└────────────────────────────┘
```

---

## 4.5 — Daily Goals (Enhanced)

### Goal Tracking

The daily goal system from Phase 1 is enhanced:

- **Goal completion** triggers streak update
- **Partial progress** is shown with a progress ring on the home screen
- **Over-achievement** awards bonus credits

### Goal Progress Ring

```
┌──────────────────┐
│    ╭──────╮      │
│   │  80%  │      │
│   │ 24/30 │      │
│    ╰──────╯      │
│   Today's Goal   │
│   6 min left!    │
└──────────────────┘
```

### Auto-Tracking

Speaking time is tracked in real-time during conversations:
- Start a timer when the conversation opens
- Pause when the app is backgrounded
- Update `daily_goals.completed_minutes` on every message
- Check for completion after each update

---

## 4.6 — Notifications & Celebrations

### In-App Notifications

Show toast notifications for:
- Credit awards: "+50 🪙 Daily Goal Complete!"
- Achievement unlocks: "🏆 Achievement Unlocked: Word Collector!"
- Streak milestones: "🔥 7-Day Streak! +150 credits"
- Level ups: "⭐ Level Up! You're now a Communicator!"

### Celebration Animations

Using Framer Motion:
- Confetti for achievements and level ups
- Coin burst for credit awards
- Flame burst for streak milestones
- Star rain for perfect scores

### Implementation

In `components/notifications/`:
- `Toast.tsx` — reusable toast component
- `Confetti.tsx` — confetti animation (canvas or CSS)
- `CreditBurst.tsx` — floating coins animation
- `LevelUpModal.tsx` — full-screen level-up celebration

---

## 4.7 — Profile Screen

### New Route: `/profile`

```
┌────────────────────────────┐
│  Profile                   │
│                            │
│  Senthil                   │
│  Level 5 · Communicator    │
│  ████████░░ 1,200/1,500 XP │
│                            │
│  Stats                     │
│  🔥 Streak: 18 days        │
│  🪙 Credits: 520           │
│  📚 Words: 47 learned      │
│  ⏱️ Time: 8.5 hours total  │
│  💬 Sessions: 23           │
│                            │
│  Achievements: 12/24       │
│  [View All →]              │
│                            │
│  Credit History             │
│  [View All →]              │
│                            │
│  Settings                  │
│  · Daily goal: 30 min      │
│  · English level: Inter.   │
│  · Name: Senthil           │
│  [Edit →]                  │
└────────────────────────────┘
```

---

## 4.8 — Daily Surprise Bonus

### Concept

Random daily bonuses to encourage opening the app:

- **Double Credits Hour**: Random 1-hour window where all credits are doubled
- **Mystery Word**: Use a specific word in conversation for bonus credits
- **Speed Round**: Complete a 5-minute conversation for triple XP

### Implementation

Simple — generate a random bonus when the user opens the app for the first time each day. Store in the daily_goals table or a separate table.

---

## Verification Checklist

- [ ] Credits are awarded correctly for all defined actions
- [ ] Credit transaction log records all credit changes
- [ ] XP is awarded and level-up triggers at correct thresholds
- [ ] Level-up shows a celebration animation
- [ ] Streak increments when daily goal is completed
- [ ] Streak resets on missed day
- [ ] Streak milestones award bonus credits
- [ ] All achievements are seeded in the database
- [ ] Achievement progress tracks correctly
- [ ] Achievement unlock triggers notification + credits
- [ ] Daily goal progress ring updates in real-time
- [ ] Toast notifications appear for all gamification events
- [ ] Celebration animations play correctly
- [ ] Profile screen shows all user stats
- [ ] Achievements screen shows unlocked/locked achievements
- [ ] Daily surprise bonus works

---

## Estimated Time

| Task | Time |
|------|------|
| Credits system + transaction log | 3–4 hours |
| XP + leveling system | 2–3 hours |
| Streak system + milestones | 3–4 hours |
| Achievements system + seed data | 4–5 hours |
| Daily goals enhancement | 2–3 hours |
| Notification toasts | 2–3 hours |
| Celebration animations | 3–4 hours |
| Profile screen | 3–4 hours |
| Achievements screen | 2–3 hours |
| Daily surprise bonus | 1–2 hours |
| Testing + bug fixes | 3–4 hours |
| **Total** | **28–39 hours** |
