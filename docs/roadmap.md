# ET (English Teacher) — Implementation Roadmap

> *Your private AI English speaking coach.*

This document provides an overview of the phased implementation plan for ET. Each phase has its own detailed file.

---

## Hardware Context

| Environment | Specs | Purpose |
|-------------|-------|---------|
| **Development** | MacBook, 24 GB RAM, Apple Silicon (no discrete GPU) | Build, test, iterate |
| **Production** | Proxmox LXC, 12 GB VRAM (GPU), Linux | Run AI models + serve the app |

### VRAM Budget (12 GB on Proxmox)

| Component | Model | VRAM |
|-----------|-------|------|
| LLM | Gemma-4-e4b (Q4_K_M) | ~4–5 GB |
| STT | Faster-Whisper (medium) | ~2 GB |
| TTS | Kokoro / Piper | ~1 GB / CPU |
| **Total** | | **~7–8 GB** ✅ |

---

## Architecture Decision: Pipeline, Not Monolith

Instead of one multimodal model doing everything, ET uses a pipeline of specialized models:

```
Voice → STT (Whisper) → Text → LLM (Gemma) → Structured JSON → TTS (Kokoro) → Speaker
```

This produces better results, uses less VRAM, and allows upgrading each component independently.

---

## Phase Overview

| Phase | Name | Focus | Est. Time |
|-------|------|-------|-----------|
| **[Phase 0](file:///Users/techkanna/Projects/et/phase-0-environment-setup.md)** | Environment Setup | Dev env, LXC, GPU passthrough, AI services | 6–10 hrs |
| **[Phase 1](file:///Users/techkanna/Projects/et/phase-1-foundation.md)** | Foundation | DB, onboarding, home screen, voice chat | 28–39 hrs |
| **[Phase 2](file:///Users/techkanna/Projects/et/phase-2-learning-engine.md)** | Learning Engine | Vocabulary, grammar, memory, context, progress | 28–38 hrs |
| **[Phase 3](file:///Users/techkanna/Projects/et/phase-3-coaching-roleplay.md)** | Coaching & Role Play | Modes, role-play, challenges, scorecards | 34–45 hrs |
| **[Phase 4](file:///Users/techkanna/Projects/et/phase-4-gamification.md)** | Gamification | Credits, XP, levels, streaks, achievements | 28–39 hrs |
| **[Phase 5](file:///Users/techkanna/Projects/et/phase-5-polish-production.md)** | Polish & Production | WebSocket streaming, animations, backup, deploy | 45–61 hrs |
| **[Phase 6](file:///Users/techkanna/Projects/et/phase-6-future-features.md)** | Future Features | Shadow speaking, rewind, YouTube, Tauri | 84–125 hrs |

**Total (Phases 0–5):** ~169–232 hours  
**Total (All Phases):** ~253–357 hours

---

## Tech Stack Summary

```
Frontend:  Next.js 15 · React · TypeScript · TailwindCSS · Shadcn UI · Framer Motion
Backend:   Next.js Route Handlers · WebSocket
AI:        Gemma-4-e4b (LM Studio) · Faster-Whisper · Kokoro/Piper TTS
Database:  SQLite · better-sqlite3
State:     Zustand · Zod
Audio:     MediaRecorder API · Web Audio API
```

---

## What Makes Each Phase a Usable Milestone

| After Phase | You Can... |
|-------------|------------|
| 0 | Confirm all infrastructure works — models respond, GPU accelerates |
| 1 | **Have a voice conversation with ET** — speak, get a spoken reply, see transcript |
| 2 | See your grammar mistakes, vocabulary growth, and progress over time |
| 3 | Practice specific scenarios (restaurant, interview, IELTS) with structured coaching |
| 4 | Stay motivated with streaks, credits, achievements, and daily challenges |
| 5 | Use a polished, production-grade app with streaming audio and rich animations |
| 6 | Use advanced learning features like shadow speaking and YouTube import |

---

## Recommended Implementation Order

> [!IMPORTANT]
> **Start using the app daily after Phase 1.** Even with just basic voice chat, daily practice builds the habit. Each subsequent phase makes the experience richer.

```
Phase 0 → Phase 1 → START USING DAILY → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
                     ▲
                     │
              This is the key moment.
              Don't wait for "perfect" — start practicing.
```

---

## Files in This Repository

```
et/
├── draft-plan.md                    ← Original vision document
├── roadmap.md                       ← This file (overview)
├── phase-0-environment-setup.md     ← Environment & infrastructure
├── phase-1-foundation.md            ← Core app: DB, voice chat, UI
├── phase-2-learning-engine.md       ← Vocabulary, grammar, memory
├── phase-3-coaching-roleplay.md     ← Modes, role-play, challenges
├── phase-4-gamification.md          ← Credits, XP, streaks
├── phase-5-polish-production.md     ← Streaming, animations, deploy
└── phase-6-future-features.md       ← Advanced features (post-launch)
```
