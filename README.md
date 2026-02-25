<div align="center">

# Pulse Tracker

### A personal hybrid athlete training platform — built because I was tired of paywalls.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?logo=openai&logoColor=white)](https://openai.com/)
[![Redis](https://img.shields.io/badge/Redis-Upstash-DC382D?logo=redis&logoColor=white)](https://upstash.com/)
[![Sentry](https://img.shields.io/badge/Sentry-Error%20Tracking-362D59?logo=sentry&logoColor=white)](https://sentry.io/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel&logoColor=white)](https://vercel.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](#license)

**[Live App](https://pulse-workout.vercel.app/)** · **[Portfolio](https://colbyrreichenbach.github.io/)** · **[LinkedIn](https://www.linkedin.com/in/colby-reichenbach/)**

</div>

---

## The Story

Every fitness app I tried had the same problem: the features that actually mattered — custom programming, detailed analytics, and intelligent coaching advice — were locked behind a subscription.

I'm a hybrid athlete. I train strength, endurance, and conditioning concurrently, which means I need a tool that tracks all three without compromise. When I couldn't find one that fit, I built it.

**Pulse Tracker is the fitness app I built for myself**, from scratch, using my own training knowledge and software engineering skills. It tracks my full 52-week hybrid training program, logs every session, visualizes long-term progress, and puts a fitness-scoped AI coach right alongside my data.

No paywalls. No artificial limitations. Full control.

---

## What It Does

### Hybrid Training System
Pulse tracks a 52-week periodized training program I designed — covering strength, endurance, and metabolic conditioning simultaneously. The program is dynamic: weights and paces auto-calculate from current PRs and benchmark test results, so targets stay accurate as you get stronger and faster.

- **Strength Tracking** — Sets, reps, and weights across barbell lifts (squat, deadlift, bench, OHP, Olympic lifts)
- **Endurance Logging** — Zone 2 runs, threshold intervals, tempo runs, rowing, cycling, and ski erg
- **Smart Load Calculation** — Workout targets resolve dynamically from 1RM and cardio benchmarks (no hardcoded numbers)
- **Auto-Advancing Weeks** — The dashboard automatically tracks which week of the program you're on based on your start date

### AI Coach — ECHO-P1
An always-on fitness coach powered by GPT-4o-mini. When data access is granted in settings, it will know your workout history, understands your current training phase, and answers questions in context — without drifting outside its lane.

- **Intent-Aware Responses** — Classifies questions as injury, logistics, progress, or general and loads the right context
- **Full History Access (Data Access Required)** — Can look up PRs, recent logs, recovery metrics, and compliance trends on demand
- **Hardened Safety Guardrails** — Built with 6 layers of protection. See [TECHNICAL.md](./TECHNICAL.md) for the full breakdown.

### Analytics Dashboard
Centralized visualization of performance data across lifting and conditioning.

- **Lift Trend Charts** — Area charts tracking volume-load week over week across major lifts
- **Progression Bars** — Bar chart view of set volume and intensity distribution
- **PR Proximity** — How close current working weights are to all-time personal records
- **Adherence Heatmap** — Week-by-week workout completion grid with readiness overlay
- **Recovery Index** — HRV and resting heart rate trends over time
- **PR History** — Full log of every personal record with date and performance context

### Multi-Tenant Architecture
Built to handle multiple users with complete data isolation — your data is never accessible to anyone else.

- **Row Level Security (RLS)** across every Supabase table
- **Server-Side Auth** — All protected pages and API routes validate the authenticated user before any data operation
- **AI Data Sandbox** — The AI coach only accesses your data, even within the same database

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 15 (App Router, Server Actions) |
| **Language** | TypeScript (Strict Mode) |
| **Database** | Supabase (PostgreSQL, Row Level Security) |
| **AI** | OpenAI GPT-4o-mini via Vercel AI SDK |
| **Rate Limiting** | Upstash Redis (`@upstash/ratelimit`) |
| **Error Tracking** | Sentry (`@sentry/nextjs`) |
| **Styling** | Vanilla CSS + Framer Motion |
| **Testing** | Vitest, Playwright, Promptfoo (LLM evals) |
| **Deployment** | Vercel |

---

## Future Iterations

This project started as a personal tool with one primary workout — my training program. Here's where it's going:

### 1. User-Importable Workout Plans
Right now, the system ships with one workout: mine. In a future version, users will be able to import their own custom programs. The system will intelligently ingest any workout structure and set up proper tracking in the database — including segment types, performance data schemas, and progression logic — without requiring manual schema changes.

### 2. AI-Writable Workouts
Today, the AI coach can read your logs and recommend changes — "you should swap that movement if your shoulder is bothering you." In the next iteration, the AI would be able to make that change directly: modifying the workout program in the database when an injury occurs, equipment isn't available, or a different stimulus is needed. Full action, not just advice.

### 3. Computer Vision Integration
The long-term vision includes a CV layer for:
- **Form Analysis** — Scan video of a user performing a lift and return coaching cues based on what the model sees
- **Equipment Recognition** — Point your camera at a piece of gym equipment and get instructions on how to use it
- **Movement Search** — Ask about an exercise and get a machine-appropriate video tutorial

### 4. ML-Based Intent Pre-Classifier
The current intent classifier uses a GPT-4o-mini call to determine whether a message is fitness-related. A future iteration would replace this with a fine-tuned, lightweight classification model (e.g., a distilled transformer or logistic regression over sentence embeddings) trained on the accumulated interaction data in `ai_logs`. This is the standard production pattern used by companies like Rasa and Aisera: a fast, cheap ML classifier runs first and assigns a confidence score — "this is 82% fitness-related" — which then gates whether the full LLM pipeline is invoked. For clearly in-scope queries, the classifier short-circuits the guardrail chain entirely, reducing latency and cost at scale. For borderline cases, the existing semantic classifier still runs as a fallback. The `ai_logs` table is already capturing the labeled interaction data needed to train this model.

---

## Changelog

| Version | Date | What Changed |
| :--- | :--- | :--- |
| 1.0.0 | 2026-01-18 | Initial release — workout logging, dashboard, AI coach |
| 1.1.0 | 2026-01-28 | Redis rate limiting, Sentry integration, privacy controls |
| 1.2.0 | 2026-02-25 | Analytics dashboard, Google OAuth, auto-advancing program weeks |

---

## Documentation

| Document | Description |
| :--- | :--- |
| [TECHNICAL.md](./TECHNICAL.md) | Architecture, AI engineering, and security deep-dive |
| [SECURITY.md](./SECURITY.md) | Security policy and vulnerability disclosure |

---

## License

Proprietary. All rights reserved. See [LICENSE](./LICENSE) for details.
