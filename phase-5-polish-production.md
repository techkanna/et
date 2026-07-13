# Phase 5 — Polish, Performance & Production Readiness

> **Goal**: Make ET production-grade. Optimize audio streaming, add rich animations, implement backup/restore, settings management, and ensure the app runs reliably on the Proxmox LXC deployment.

---

## Prerequisites

- Phase 4 complete (all gamification features working)

---

## 5.1 — Audio Streaming (WebSocket)

### Problem

The Phase 1 audio flow is request/response:

```
Record full audio → Send → Wait for STT → Wait for LLM → Wait for TTS → Play
```

This creates noticeable latency (3–8 seconds). Users expect near-instant responses.

### Solution: WebSocket Streaming

Replace the HTTP request/response model with a WebSocket connection:

```
Client                              Server
  │                                   │
  │── WebSocket connect ──────────►   │
  │                                   │
  │── audio chunks (streaming) ───►   │
  │                                   │  → STT (streaming)
  │                                   │  → LLM (streaming)
  │                                   │  → TTS (streaming)
  │                                   │
  │◄── transcription (partial) ─────  │
  │◄── teacher reply (streaming) ──   │
  │◄── audio chunks (streaming) ────  │
  │                                   │
```

### Implementation

#### Server: `app/api/ws/route.ts`

WebSocket handler that:
1. Receives audio chunks from the client
2. Streams them to Faster-Whisper for real-time transcription
3. Sends partial transcripts back to the client as they arrive
4. Once the user stops speaking, sends the full transcript to Gemma
5. Streams the Gemma response token-by-token
6. Pipes the completed response text to TTS
7. Streams TTS audio chunks back to the client

#### Client: `lib/audio/websocket.ts`

```typescript
class AudioWebSocket {
  connect(conversationId: number): void
  sendAudioChunk(chunk: ArrayBuffer): void
  onPartialTranscript(callback: (text: string) => void): void
  onTeacherReply(callback: (text: string) => void): void
  onAudioChunk(callback: (chunk: ArrayBuffer) => void): void
  disconnect(): void
}
```

### Benefits

- User sees their words appearing in real-time
- Teacher's reply starts appearing before it's fully generated
- Audio starts playing before the full response is synthesized
- Feels like a real conversation, not a turn-based game

> [!IMPORTANT]
> WebSocket streaming requires careful error handling — dropped connections, partial messages, reconnection logic. Budget extra time for edge cases.

---

## 5.2 — Rich Animations & Micro-Interactions

### Speaking Session Animations

| Element | Animation |
|---------|-----------|
| AI Avatar | Pulses with breathing rhythm when idle, grows/shrinks with audio amplitude when speaking |
| Waveform | Real-time FFT waveform from microphone input |
| Transcript | Typewriter effect for AI replies |
| Score changes | Count-up animation (72 → 85) with color transitions |
| Mode transitions | Smooth page transitions with shared element animations |

### Home Screen Animations

| Element | Animation |
|---------|-----------|
| Streak fire | Flame grows with streak length, particles rise |
| Goal progress | Ring fills smoothly with spring physics |
| Credits | Counter rolls up/down on change |
| Quick action cards | Stagger-in on page load |
| Greeting | Fade in with slight upward motion |

### Implementation

Using Framer Motion:

- `components/animations/PulsingAvatar.tsx`
- `components/animations/AudioWaveform.tsx`
- `components/animations/TypewriterText.tsx`
- `components/animations/CountUp.tsx`
- `components/animations/StreakFire.tsx`
- `components/animations/ProgressRing.tsx`

### Page Transitions

Use Framer Motion's `AnimatePresence` + `motion.div` for:
- Slide transitions between pages
- Fade in/out for modals
- Spring animations for cards and buttons

---

## 5.3 — Settings & Model Management

### Settings Screen

New route: `/settings`

```
┌────────────────────────────┐
│  Settings                  │
│                            │
│  Profile                   │
│  · Name: Senthil           │
│  · Native Language: Tamil  │
│  · English Level: Inter.   │
│  · Daily Goal: 30 min      │
│                            │
│  AI Models                 │
│  · LLM: Gemma-4-e4b       │
│    URL: localhost:11434     │
│    Status: ✅ Connected     │
│  · STT: Faster-Whisper     │
│    URL: localhost:8100      │
│    Status: ✅ Connected     │
│  · TTS: Kokoro             │
│    URL: localhost:8200      │
│    Status: ✅ Connected     │
│                            │
│  Audio                     │
│  · Auto-stop silence: 2s   │
│  · Audio quality: High     │
│  · Voice: Default          │
│                            │
│  Data                      │
│  · Export Data             │
│  · Backup Database         │
│  · Restore from Backup     │
│  · Reset All Data ⚠️       │
│                            │
│  About                     │
│  · Version: 1.0.0          │
│  · Storage used: 245 MB    │
└────────────────────────────┘
```

### Model Health Check

In `lib/ai/health.ts`:

```typescript
async function checkModelHealth(): Promise<{
  llm: { status: 'connected' | 'error'; model: string; latency: number };
  stt: { status: 'connected' | 'error'; model: string; latency: number };
  tts: { status: 'connected' | 'error'; model: string; latency: number };
}>
```

- Ping each AI service on settings page load
- Show connection status with green/red indicators
- Show latency for each service

---

## 5.4 — Backup & Restore

### Backup

Create a full backup of:
- SQLite database file
- Storage directory (audio files)
- Learner memory

API route: `POST /api/backup`

```typescript
// Creates a zip file containing:
// - database.db
// - storage/ directory
// - metadata.json (version, date, user info)
```

Returns a downloadable `.zip` file.

### Restore

API route: `POST /api/restore`

- Accept a `.zip` file upload
- Validate the backup format and version
- Replace the current database and storage
- Restart the app

### Auto-Backup

Schedule automatic backups:
- Daily backup to `storage/backups/`
- Keep the last 7 daily backups
- Keep the last 4 weekly backups

---

## 5.5 — Export Conversation History

### Export Formats

- **JSON**: Full structured export of all conversations, messages, scores
- **Markdown**: Human-readable conversation transcripts
- **CSV**: Vocabulary list with mastery scores

### Implementation

API route: `GET /api/export?format=json|markdown|csv&type=conversations|vocabulary|mistakes`

---

## 5.6 — Error Handling & Resilience

### AI Service Failures

When an AI service is down:

| Service | Fallback |
|---------|----------|
| LLM (Gemma) | Show error message: "ET is taking a break. Please check that Ollama is running." |
| STT (Whisper) | Fall back to text input mode: "I can't hear you right now. Type your message instead." |
| TTS | Fall back to text-only: show the reply as text without audio |

### Network Issues

- WebSocket auto-reconnection with exponential backoff
- Queue messages during disconnection
- Replay queued messages on reconnection

### Audio Issues

- Handle microphone permission denial gracefully
- Detect when no microphone is available
- Handle audio playback failures

---

## 5.7 — Performance Optimization

### Database

- Add indexes to frequently queried columns:
  ```sql
  CREATE INDEX idx_messages_conversation ON messages(conversation_id);
  CREATE INDEX idx_vocabulary_user_mastery ON vocabulary(user_id, mastery);
  CREATE INDEX idx_mistakes_user_category ON mistakes(user_id, category);
  CREATE INDEX idx_daily_goals_date ON daily_goals(date, user_id);
  ```

- Use WAL mode for better concurrent read/write:
  ```sql
  PRAGMA journal_mode=WAL;
  ```

### Audio Files

- Compress audio files older than 30 days
- Optionally delete audio files for conversations older than 90 days (configurable)
- Track storage usage and show on settings page

### Client-Side

- Lazy load the speaking session components
- Preload the AI avatar and waveform assets
- Use `React.memo` for expensive chart components
- Debounce real-time updates (waveform, transcript)

---

## 5.8 — Responsive Design

### Desktop-First, Mobile-Aware

Since this runs on a local network (LXC → browser), it's primarily a desktop app. But make it usable on mobile too (e.g., accessing from a phone on the same network).

- Home screen: responsive grid (2-column on desktop, 1-column on mobile)
- Speaking session: full-screen experience on all sizes
- Progress dashboard: charts resize appropriately
- Settings: single-column layout

---

## 5.9 — Production Deployment Hardening

### Systemd Services on LXC

Create systemd unit files for:

1. **Ollama** (if not already a system service)
2. **Faster-Whisper server**
3. **TTS server (Kokoro/Piper)**
4. **ET (Next.js)**

Example for ET:

```ini
[Unit]
Description=ET English Teacher
After=network.target ollama.service

[Service]
Type=simple
User=et
WorkingDirectory=/opt/et
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=ET_LLM_BASE_URL=http://localhost:11434/v1
Environment=ET_STT_BASE_URL=http://localhost:8100
Environment=ET_TTS_BASE_URL=http://localhost:8200
Environment=ET_DATABASE_PATH=/opt/et/data/database.db

[Install]
WantedBy=multi-user.target
```

### Reverse Proxy (Optional)

If you want to access ET from outside the LXC:
- Use Caddy or Nginx as a reverse proxy
- Automatic HTTPS with Let's Encrypt (if exposed to internet)
- Or simple HTTP for local network access

### Monitoring

Simple health monitoring:
- API endpoint: `GET /api/health` — returns status of all services
- Log rotation for the Node.js app
- Disk space monitoring for audio storage

---

## 5.10 — Dark Mode & Theming

### Default: Dark Mode

The app should default to dark mode (as shown in the draft plan's aesthetic):

- Dark background: `#0a0a0f` to `#1a1a2e`
- Accent gradient: purple → blue → teal
- Glass morphism cards with subtle backdrop blur
- Warm text colors: soft white and muted grays

### Light Mode (Optional Toggle)

- Clean white backgrounds
- Softer accent colors
- Toggle in settings

### Theme System

Use CSS variables for theming:

```css
:root {
  --bg-primary: #0a0a0f;
  --bg-card: rgba(255, 255, 255, 0.05);
  --text-primary: #f0f0f0;
  --accent-primary: #7c3aed;
  --accent-secondary: #06b6d4;
  /* ... */
}

[data-theme="light"] {
  --bg-primary: #fafafa;
  --bg-card: #ffffff;
  --text-primary: #1a1a2e;
  /* ... */
}
```

---

## Verification Checklist

- [ ] WebSocket audio streaming reduces perceived latency significantly
- [ ] Real-time transcript appears as the user speaks
- [ ] AI replies stream token-by-token to the UI
- [ ] All animations are smooth at 60fps
- [ ] Page transitions feel natural
- [ ] Settings page shows all configurable options
- [ ] Model health check shows correct status for all services
- [ ] Backup creates a valid zip file that can be downloaded
- [ ] Restore from backup works correctly
- [ ] Export in JSON, Markdown, and CSV formats works
- [ ] AI service failures are handled gracefully with fallbacks
- [ ] Database has proper indexes and performs well
- [ ] App is responsive on desktop and mobile
- [ ] Systemd services start on boot and restart on failure
- [ ] Dark mode looks polished and premium
- [ ] Storage usage is tracked and displayed

---

## Estimated Time

| Task | Time |
|------|------|
| WebSocket audio streaming | 8–12 hours |
| Rich animations + micro-interactions | 6–8 hours |
| Settings screen + model health | 3–4 hours |
| Backup & restore | 4–5 hours |
| Export functionality | 2–3 hours |
| Error handling & resilience | 4–5 hours |
| Performance optimization | 3–4 hours |
| Responsive design | 3–4 hours |
| Production deployment hardening | 4–6 hours |
| Dark mode & theming | 3–4 hours |
| Testing + bug fixes | 5–6 hours |
| **Total** | **45–61 hours** |
