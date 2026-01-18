# Pulse Tracker

A modern workout tracking dashboard with AI coaching, analytics, and biometric integration.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)

## Features

- **Workout Tracking** – Log strength, cardio, and metcon sessions
- **Analytics Dashboard** – Visualize progress and PRs over time
- **AI Coach** – Personalized advice powered by GPT-4o
- **Biometrics** – Track HRV, sleep, and recovery metrics
- **Guest Mode** – Try without an account

## Quick Start

```bash
# Install
npm install

# Configure environment
cp .env.example .env.local
# Add your Supabase and OpenAI keys

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (Email, Google OAuth) |
| AI | OpenAI GPT-4o |
| Styling | Tailwind CSS, Framer Motion |

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
OPENAI_API_KEY=your_openai_api_key
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run test` | Run tests |
| `npm run lint` | ESLint check |

## Deployment

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

## License

MIT
