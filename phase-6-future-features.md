# Phase 6 — Future Features (Post-Launch)

> **Goal**: Advanced features that make ET truly stand out — shadow speaking, conversation rewind, YouTube import, personalized lesson plans, accent training, and multi-model support. These are built after the core product is solid and you're using it daily.

---

## Prerequisites

- Phase 5 complete (production-ready app running on Proxmox LXC)
- **Daily usage for at least 2 weeks** — so you understand what's actually missing

---

> [!NOTE]
> This phase is intentionally less detailed than phases 0–5. These features should be planned in detail only after you've used the core product and have real feedback about what matters most.

---

## 6.1 — Shadow Speaking (Repeat After AI)

### Concept

AI says a sentence → user repeats it → system compares the transcriptions.

### Flow

```
AI speaks: "I went to the store yesterday."
  ↓
User hears + reads the sentence
  ↓
User taps "Repeat" and speaks the same sentence
  ↓
STT transcribes the user's attempt
  ↓
Compare: expected text vs user's text
  ↓
Highlight differences:
  Expected: "I went to the store yesterday"
  User said: "I went to the store yester day"
                                   ^^^^^^^^
  Issue: word splitting — "yesterday" pronounced as two words
  ↓
Score the attempt + offer retry
```

### No LLM Required

Shadow speaking uses only STT + text comparison. Gemma is not needed during the exercise itself — only for selecting appropriate sentences and providing feedback after.

### Sentence Selection

Use Gemma to generate practice sentences based on the learner's weaknesses:

```
"Generate 10 sentences that practice TH sounds and articles.
 Difficulty: intermediate."
```

### VRAM Impact

Minimal — only STT runs during shadow speaking (~2 GB).

---

## 6.2 — Conversation Rewind

### Concept

Replay any past conversation, listen to your recordings, see the corrections, and retry specific parts.

### Flow

```
Open conversation history
  ↓
Select a past conversation
  ↓
See the full timeline with:
  - Your original audio
  - Your transcript
  - AI's response
  - Grammar corrections
  - Scores per message
  ↓
Tap any of your messages to:
  - Replay your audio
  - See what you said wrong
  - Retry: record a new attempt
  - Compare old vs new attempt
```

### Implementation

- Route: `/history/:conversationId`
- Most data already exists (messages, audio files, corrections)
- New: retry functionality — record a new audio, transcribe, compare to original

### VRAM Impact

None for playback. STT only for retry attempts.

---

## 6.3 — Personalized Lesson Plans

### Concept

Gemma generates a weekly lesson plan based on the learner's profile.

### Flow

```
Every Sunday (or on demand):
  ↓
Analyze learner memory:
  - Weaknesses
  - Vocabulary gaps
  - Recurring mistakes
  - Untried scenarios
  ↓
Generate a lesson plan:

  Monday:    Restaurant roleplay (articles focus)
  Tuesday:   Daily English (past tense review)
  Wednesday: Shadow speaking (TH sounds)
  Thursday:  Interview practice
  Friday:    Free conversation (use new vocabulary)
  Saturday:  IELTS Part 2 practice
  Sunday:    Review & quiz
```

### Display

New route: `/lessons`

Show the weekly plan with:
- Each day's suggested activity
- Completion status
- Tap to start the suggested session

---

## 6.4 — Accent Training

### Level 1: LLM-Based Hints (Feasible Now)

Gemma identifies common pronunciation patterns for Tamil speakers:

```
Common Tamil English patterns:
- "th" → "t" (think → tink)
- "v" ↔ "w" (very → wery)
- Missing final consonants
- Retroflex 'd' and 't'
```

Include these in the system prompt so Gemma can give targeted pronunciation advice.

### Level 2: Phoneme-Level Analysis (Future)

Requires a dedicated pronunciation scoring model:

- **wav2vec2** fine-tuned for pronunciation assessment
- **SpeechBrain** for phoneme alignment
- Compare phoneme sequences against a reference

This is computationally expensive and would need careful VRAM scheduling on the 12 GB GPU.

---

## 6.5 — YouTube Video Import

### Concept

Import a YouTube video → extract audio → transcribe → create learning materials.

### Pipeline

```
YouTube URL
  ↓
yt-dlp (download audio only)
  ↓
Faster-Whisper (transcribe)
  ↓
Sentence segmentation
  ↓
Create learning materials:
  - Shadow speaking exercises (repeat sentences)
  - Vocabulary extraction
  - Comprehension questions (Gemma)
  - Fill-in-the-blanks (Gemma)
```

### Implementation

- Route: `/import/youtube`
- Backend: use `yt-dlp` to extract audio, then process through the existing pipeline
- Store imported content as a "lesson" that can be practiced multiple times

### VRAM Impact

STT for transcription (~2 GB), LLM for generating exercises (~4-5 GB). Sequential, not simultaneous.

---

## 6.6 — AI-Generated Speaking Quizzes

### Quiz Types

1. **Vocabulary Quiz**: "Use the word 'nevertheless' in a sentence about your work."
2. **Grammar Quiz**: "Describe what you did yesterday using past tense only."
3. **Pronunciation Quiz**: "Say these 5 words clearly: thought, through, comfortable, vegetable, environment."
4. **Comprehension Quiz**: After a listening exercise, answer questions about what you heard.

### Flow

```
Generate quiz based on learner profile
  ↓
Present question (text + audio)
  ↓
User speaks their answer
  ↓
STT → transcript
  ↓
Gemma evaluates the answer
  ↓
Score + feedback
  ↓
Next question
```

---

## 6.7 — Multi-Model Support

### Concept

Allow switching between different LLM models:

| Model | Size | Use Case |
|-------|------|----------|
| Gemma-4-e4b | ~5 GB VRAM | Default, great for conversation |
| Qwen 2.5 7B | ~5 GB VRAM | Alternative conversationalist |
| Llama 3.1 8B | ~5 GB VRAM | Another alternative |
| Phi-3 | ~3 GB VRAM | Lightweight, faster responses |

### Implementation

- Settings page: model selector dropdown
- Ollama already supports multiple models
- Just change the `model` parameter in the chat completion request
- Test prompt compatibility across models (JSON output format)

### STT Model Options

| Model | Size | Speed |
|-------|------|-------|
| Whisper tiny | ~75 MB | Very fast, less accurate |
| Whisper small | ~250 MB | Fast, good accuracy |
| Whisper medium | ~750 MB | Slower, better accuracy |
| Whisper large-v3 | ~1.5 GB | Slowest, best accuracy |
| Parakeet | ~500 MB | Fast, good for Indian English |

### TTS Model Options

| Model | Size | Quality |
|-------|------|---------|
| Piper | CPU only | Good, many voices |
| Kokoro | ~1 GB GPU | Very natural |
| Coqui XTTS | ~2 GB GPU | Natural, voice cloning |

---

## 6.8 — Offline Desktop App (Tauri)

### Long-Term Vision

Package ET as a standalone desktop app using Tauri:

- Single binary that includes the Next.js app + SQLite
- Bundle Ollama and models within the app
- True offline-first — no server needed
- Available on macOS, Windows, Linux

> [!NOTE]
> This is a major undertaking and should only be considered after the web version is mature. Tauri v2 + Next.js integration has complexities around SSR vs static export.

---

## 6.9 — Feature Priority Matrix

Based on impact vs effort, here's the recommended order within Phase 6:

| Priority | Feature | Impact | Effort | VRAM Friendly |
|----------|---------|--------|--------|---------------|
| 1 | Shadow Speaking | ⭐⭐⭐⭐⭐ | Low | ✅ |
| 2 | Conversation Rewind | ⭐⭐⭐⭐ | Low | ✅ |
| 3 | Personalized Lesson Plans | ⭐⭐⭐⭐⭐ | Medium | ✅ |
| 4 | AI Quizzes | ⭐⭐⭐⭐ | Medium | ✅ |
| 5 | YouTube Import | ⭐⭐⭐ | Medium | ✅ |
| 6 | Multi-Model Support | ⭐⭐⭐ | Low | ✅ |
| 7 | Accent Training (L1) | ⭐⭐⭐⭐ | Low | ✅ |
| 8 | Accent Training (L2) | ⭐⭐⭐⭐⭐ | High | ⚠️ |
| 9 | Tauri Desktop App | ⭐⭐⭐ | Very High | ✅ |

---

## Estimated Time (Combined)

| Feature | Time |
|---------|------|
| Shadow Speaking | 8–12 hours |
| Conversation Rewind | 6–8 hours |
| Personalized Lesson Plans | 6–8 hours |
| AI Quizzes | 6–8 hours |
| YouTube Import | 8–12 hours |
| Multi-Model Support | 3–4 hours |
| Accent Training (L1) | 2–3 hours |
| Accent Training (L2) | 15–20 hours |
| Tauri Desktop App | 30–50 hours |
| **Total** | **84–125 hours** |

> [!TIP]
> Don't plan all of these at once. Pick the top 2-3 based on what you actually need after using ET daily for a few weeks.
