# Pulse Tracker: Hybrid Athlete Training Platform

Pulse Tracker is a high-performance workout tracking and AI-coaching dashboard designed for hybrid athletes. It integrates strength training, aerobic conditioning, and biometric analysis into a single, production-hardened ecosystem.

![Next.js](https://img.shields.io/badge/Next.js-16.1.3-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![Redis](https://img.shields.io/badge/Redis-Upstash-red)
![Sentry](https://img.shields.io/badge/Sentry-Error--Tracking-purple)

## Core Features

### Hybrid Training System
The platform implements a structured, multi-phase 52-week training methodology designed for concurrent development of strength and endurance.
- **Strength Tracking**: Quantitative logging for various modalities including traditional resistance training, Olympic lifting, and metabolic conditioning.
- **Endurance Integration**: Precise tracking for Zone 2 aerobic base building, threshold intervals, and maximum effort sprints.
- **Adaptive Programming**: Automated recalculation of training loads (1RM, heart rate zones, pace targets) based on performance checkpoints.

### Intelligent AI Coaching (ECHO-P1)
A stateful, intent-aware AI assistant powered by GPT-4o-mini provides real-time training modifications and production-grade safety.
- **Conversational Context**: Maintains awareness of multi-turn interactions and recently discussed exercises for consistent advice.
- **Intent-Based Routing**: Dynamically classifies user queries to provide specialized context (e.g., injury management, technical substitution, or data analysis).
- **Hardened Guardrails**: Built-in PII redaction, injection detection, and immutable auditing for every interaction.

### Biometric & Performance Analytics
Centralized visualization of physiological data helps optimize recovery and long-term adaptation.
- **Biometric Monitoring**: Integration for HRV, sleep quality, resting heart rate, and subjective readiness scores.
- **Progressive Overload Tracking**: Detailed visualizations of volume trends and PR history across primary movement patterns.
- **Data Isolation**: Multi-tenant architecture using Supabase Row Level Security (RLS) ensures absolute data privacy and integrity.

---

## Technical Architecture

The system is built on a modern, distributed architecture designed for low latency and high availability.

| Component | Implementation |
| :--- | :--- |
| **Framework** | Next.js 16.1.3 (App Router) |
| **Language** | TypeScript (Strict Mode) |
| **Database** | Supabase (PostgreSQL + RLS) |
| **Real-time AI** | OpenAI GPT-4o-mini (Vortex Optimized) |
| **Infrastructure** | Upstash Redis (Rate Limiting), Sentry (Monitoring) |
| **Testing** | Vitest, Playwright, Promptfoo (LLM Evals) |
| **Styling** | Vanilla CSS (Themed Components), Framer Motion |

---

## Development Setup

### Prerequisites
- Node.js (v20 or later)
- Supabase Project
- OpenAI API Key
- Redis Instance (Upstash recommended)
- Sentry DSN

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/ColbyRReichenbach/workout-web.git
   cd workout-web
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Add your service credentials to `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key
   UPSTASH_REDIS_REST_URL=your_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_redis_token
   SENTRY_DSN=your_sentry_dsn
   ```

### Execution
Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Testing and AI Evaluations
The project utilizes a comprehensive suite to ensure security and logical correctness.

```bash
# Run unit and integration tests
npm run test

# Run end-to-end browser tests
npm run test:e2e

# Run LLM safety and response evaluations
npx promptfoo eval
```

## Deployment
Production deployment is optimized for Vercel. Ensure all environment variables are correctly mapped in the Vercel Dashboard before deployment.

## License
Proprietary. All rights reserved. See [LICENSE](file:///Users/colbyreichenbach/Desktop/workout-web-2/LICENSE) for details.
