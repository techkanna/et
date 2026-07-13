# Phase 0 — Environment & Infrastructure Setup

> **Goal**: Set up the development environment on your MacBook (24 GB RAM) and prepare the deployment target (Proxmox LXC, 12 GB VRAM) so all subsequent phases can build and deploy smoothly.

---

## Why This Phase Exists

The draft plan jumps straight into "Next.js project setup", but before writing any application code you need:

1. A reproducible dev environment on macOS
2. A deployment target configured with GPU passthrough
3. AI model serving infrastructure (Whisper, Gemma, TTS) tested and verified
4. A clear contract between the app and the AI services (OpenAI-compatible API)

Getting this right first avoids painful rework later.

---

## 0.1 — MacBook Development Environment

### Node.js & Package Manager

- Install Node.js 22 LTS (or latest stable) via `nvm` or `fnm`
- Use `pnpm` as the package manager (faster, disk-efficient)
- Verify: `node -v`, `pnpm -v`

### Project Scaffold

- Initialize the Next.js 15 project (Next.js 16 is not yet stable; use 15 with App Router)
  - TypeScript, ESLint, TailwindCSS v4, `src/` directory
- Install core dependencies:
  - `better-sqlite3` — SQLite ORM
  - `zod` — validation
  - `zustand` — client state
  - `framer-motion` — animations
  - `shadcn/ui` — component library
- Create the folder structure from the draft plan

### Local AI for Development (CPU-only on Mac)

Since your MacBook has no discrete GPU, AI models run on CPU during development. This is fine for testing the integration layer — you won't be doing heavy inference on the Mac.

| Component | Dev Approach |
|-----------|-------------|
| LLM (Gemma) | Use [LM Studio](https://lmstudio.ai) — runs Gemma-4-e4b on Apple Silicon via Metal. Exposes OpenAI-compatible API at `http://127.0.0.1:1234/v1` (supports `/v1/chat/completions`, `/v1/models`, `/v1/embeddings`) |
| STT (Whisper) | Use a lightweight `whisper.cpp` binary for macOS, or a Faster-Whisper server |
| TTS | Use browser-native `SpeechSynthesis` API during dev. Real TTS on the server. |

> [!TIP]
> During development, you can also mock the AI responses with canned JSON to iterate on the UI without waiting for model inference.

---

## 0.2 — Proxmox LXC Deployment Target

### LXC Container Setup

- Create a new **privileged** LXC container (Ubuntu 24.04 or Debian 12)
- Allocate resources:
  - **RAM**: 8–10 GB (leave headroom for the host)
  - **Swap**: 4 GB
  - **Disk**: 50+ GB (models are large)
  - **CPU**: 4–6 cores
- **GPU Passthrough**: Pass the GPU (NVIDIA with 12 GB VRAM) into the LXC
  - Install NVIDIA drivers on the Proxmox host
  - Configure `/etc/pve/lxc/<id>.conf` for GPU device passthrough
  - Verify inside the container: `nvidia-smi`

### AI Model Serving on the LXC

All AI models run as **services** behind OpenAI-compatible APIs. The Next.js app talks to them over HTTP — it never loads models itself.

| Service | Model | Tool | Port | VRAM Usage |
|---------|-------|------|------|------------|
| **LLM** | Gemma-4-e4b (Q4_K_M) | LM Studio (headless via `lms`) | `1234` | ~6.3 GB |
| **STT** | Faster-Whisper (medium) | faster-whisper-server | `8100` | ~2 GB |
| **TTS** | Kokoro or Piper | kokoro-fastapi or Piper HTTP | `8200` | ~1 GB (Kokoro) or CPU (Piper) |

**Total VRAM**: ~7–8 GB, well within 12 GB.

> [!IMPORTANT]
> Models should NOT all be loaded simultaneously during initial development. Load LLM + STT for conversation, and TTS on-demand. LM Studio supports configurable idle TTL and auto-eviction to free VRAM when models aren't in use.

### Sequential Model Loading Strategy

Since 12 GB VRAM is shared:

```
Conversation Flow:
  1. STT loads → transcribes → unloads (or stays resident, ~2 GB)
  2. LLM loads → generates response → stays resident (~6.3 GB)
  3. TTS loads → speaks → unloads (or stays resident, ~1 GB)
```

LM Studio's idle TTL and auto-eviction settings manage model loading/unloading automatically. Configure via the server settings or `lms` CLI on the LXC. This means you can run all three services without manual VRAM management.

### LM Studio on the LXC (Headless)

On the Linux LXC container, run LM Studio in headless mode using the `lms` CLI:

```bash
# Install LM Studio CLI
npx lmstudio install-cli

# Download the model
lms get google/gemma-4-e4b --q4_k_m

# Start the server in headless mode
lms server start --port 1234

# Load the model
lms load google/gemma-4-e4b

# Verify
curl http://localhost:1234/v1/models
```

---

## 0.3 — Node.js Runtime on LXC

- Install Node.js 22 LTS via `nvm`
- Install `pnpm`
- Set up a deployment directory: `/opt/et/`
- Configure a systemd service for the Next.js production server
- Set environment variables:
  ```env
  ET_LLM_BASE_URL=http://localhost:1234/v1
  ET_STT_BASE_URL=http://localhost:8100
  ET_TTS_BASE_URL=http://localhost:8200
  ET_DATABASE_PATH=/opt/et/data/database.db
  ET_STORAGE_PATH=/opt/et/storage
  ```

---

## 0.4 — Deployment Pipeline

Keep it simple — no Docker, no Kubernetes. Just:

1. **Build** on MacBook: `pnpm build`
2. **Transfer** the `.next/standalone` output to the LXC via `rsync` or `scp`
3. **Restart** the systemd service on the LXC

Optionally, set up a simple shell script or Makefile:

```bash
# deploy.sh
pnpm build
rsync -avz --delete .next/standalone/ user@proxmox-lxc:/opt/et/
rsync -avz public/ user@proxmox-lxc:/opt/et/public/
rsync -avz .next/static/ user@proxmox-lxc:/opt/et/.next/static/
ssh user@proxmox-lxc "sudo systemctl restart et"
```

---

## 0.5 — Verification Checklist

- [x] MacBook: `pnpm dev` starts the Next.js app
- [x] MacBook: LM Studio serves Gemma-4-e4b and responds to `/v1/chat/completions`
- [x] MacBook: App can reach the LLM API at `http://127.0.0.1:1234/v1` and get a response
- [ ] LXC: `nvidia-smi` shows the GPU
- [ ] LXC: LM Studio headless (`lms server start`) serves Gemma with GPU acceleration
- [ ] LXC: Faster-Whisper server accepts audio and returns transcript
- [ ] LXC: TTS server accepts text and returns audio
- [ ] LXC: Next.js production build runs and serves the app
- [ ] LXC: App connects to all three AI services successfully

---

## Dependencies for Later Phases

This phase produces:

| Output | Used By |
|--------|---------|
| Next.js project scaffold | Phase 1 (Foundation) |
| SQLite database file | Phase 1 (Database schema) |
| AI service URLs (env vars) | Phase 1 (AI integration) |
| Deployment pipeline | All phases |
| GPU-accelerated LXC | All phases (production) |

---

## Estimated Time

| Task | Time |
|------|------|
| MacBook dev setup | 1–2 hours |
| LXC creation + GPU passthrough | 2–4 hours |
| AI model serving setup | 2–3 hours |
| Deployment pipeline | 1 hour |
| **Total** | **6–10 hours** |

---

## Progress Status

### ✅ Completed
- Verified Node v22 and pnpm v10 are installed.
- Verified LM Studio is running on `127.0.0.1:1234` with the `google/gemma-4-e4b` model loaded.
- Scaffolded Next.js 16 app with `pnpm`, TypeScript, Tailwind v4, ESLint, and App Router.
- Installed core dependencies: `better-sqlite3`, `zod`, `zustand`, `framer-motion`, and `shadcn/ui`.
- Configured native build bindings for `better-sqlite3`.
- Initialized `shadcn/ui`.
- Created the project directory structure (`features/`, `lib/`, `storage/`, etc.).
- Created `.env.local` and `.env.example` configurations.
- Updated `.gitignore` to exclude local storage and database files.
- Built the project successfully (`pnpm build`).

### ⏳ Pending (To be done manually later)
- Proxmox LXC container setup & GPU passthrough.
- Headless LM Studio (`lms`), Faster-Whisper, and TTS setup on LXC.
- Systemd service configuration for Next.js on LXC.
- Deployment pipeline to transfer builds from MacBook to LXC.
