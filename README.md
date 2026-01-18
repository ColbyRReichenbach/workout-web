# Pulse

A performance-focused workout tracking application built for hybrid athletes. Currently in active personal use with a production-ready architecture.

## Overview

Pulse tracks strength training, conditioning, and recovery data through an integrated dashboard. It correlates biometric inputs (sleep, HRV, readiness) with session output to surface actionable insights over multi-phase training blocks.

**Live Demo:** [pulse-workout.vercel.app](https://pulse-workout.vercel.app)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Database | Supabase (PostgreSQL + RLS) |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Auth | Supabase Auth (OAuth, Email) |

## Features

- **Phase-aware programming** — Supports periodized training blocks (Structural, Strength, Peak)
- **Biometric integration** — Correlates HealthKit sleep/HRV data with performance
- **Session logging** — Set-by-set tracking with RPE, load, and volume calculations
- **Analytics dashboard** — Tonnage trends, PR proximity, recovery index visualization
- **AI Coach** — Contextual guidance based on current phase and biometric state

## Local Development

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Add your Supabase URL and anon key

# Start development server
npm run dev
```

Requires Node.js 20+ and a Supabase project.

## Architecture

```
src/
├── app/                # Next.js App Router pages
│   ├── (dashboard)/    # Authenticated routes
│   └── actions/        # Server actions
├── components/         # Reusable UI components
├── lib/                # Types, utilities
└── utils/              # Supabase client config
```

Database schema follows a relational model with Row-Level Security policies for multi-user scalability.

## Roadmap

- [ ] Apple Watch companion app
- [ ] Multi-user team features
- [ ] Advanced periodization templates
- [ ] Export/reporting functionality

## License

MIT
