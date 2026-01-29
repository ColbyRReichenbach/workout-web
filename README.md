# Pulse Tracker: Hybrid Athlete Training Platform

Pulse Tracker is a high-performance workout tracking and AI-coaching dashboard designed for hybrid athletes. It integrates strength training, aerobic conditioning, and biometric analysis into a single, cohesive ecosystem.

## Core Features

### Hybrid Training System
The platform implements a structured, multi-phase 52-week training methodology designed for concurrent development of strength and endurance.
- **Strength Tracking**: Quantitative logging for various modalities including traditional resistance training, Olympic lifting, and metabolic conditioning.
- **Endurance Integration**: Precise tracking for Zone 2 aerobic base building, threshold intervals, and maximum effort sprints.
- **Adaptive Programming**: Automated recalculation of training loads (1RM, heart rate zones, pace targets) based on performance checkpoints.

### Intelligent AI Coaching (ECHO-P1)
A stateful, intent-aware AI assistant provides real-time training modifications and data analysis.
- **Conversational Context**: Maintains awareness of multi-turn interactions and recently discussed exercises for consistent advice.
- **Intent-Based Routing**: Dynamically classifies user queries to provide specialized context (e.g., injury management, technical substitution, or data analysis).
- **Multi-Persona Architecture**: Supports distinct coaching styles ranging from highly analytical physiological feedback to high-intensity motivational cueing.

### Biometric & Performance Analytics
Centralized visualization of physiological data helps optimize recovery and long-term adaptation.
- **Biometric Monitoring**: Integration for HRV, sleep quality, resting heart rate, and subjective readiness scores.
- **Progressive Overload Tracking**: Detailed visualizations of volume trends and PR history across primary movement patterns.
- **Data Isolation**: Multi-tenant architecture using Supabase Row Level Security (RLS) ensures absolute data privacy and integrity.

## Technical Architecture

The system is built on a modern, distributed architecture designed for low latency and high availability.

| Component | Implementation |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript (Strict Mode) |
| **Database** | Supabase (PostgreSQL) |
| **Real-time AI** | OpenAI GPT-4o / GPT-4o-mini |
| **Streaming** | Vercel AI SDK (Server-Sent Events) |
| **Caching/Rate Limiting** | Redis (Upstash) |
| **Observability** | Sentry (Error Tracking & Performance) |
| **Styling** | Vanilla CSS (Themed Components) |

## Development Setup

### Prerequisites
- Node.js (v20 or later)
- Supabase Project
- OpenAI API Key
- Redis Instance (Upstash recommended)

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
   Populate `.env.local` with your service credentials following the structure in the provided example file.

### Execution
Start the development server:
```bash
npm run dev
```

### Testing and Validation
The project utilizes a comprehensive testing suite to ensure security and logical correctness.
- **Unit Testing**: Run `npm run test` to execute Vitest suites.
- **End-to-End Testing**: Run `npx playwright test` for browser-based validation.
- **Security Audits**: Specialized tests for AI guardrails and data isolation are located in `tests/security`.

## Deployment
Production deployment is optimized for the Vercel platform. Ensure all environment variables are correctly mapped in the Vercel Dashboard before deployment.

## License
Distributed under the MIT License.
