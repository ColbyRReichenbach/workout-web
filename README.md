# Pulse Tracker

Elite Training Dashboard - Track workouts, analyze performance, and get AI-powered coaching.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)

## Features

- 🏋️ **Workout Tracking** - Log strength, cardio, and metcon sessions with detailed performance data
- 📊 **Analytics Dashboard** - Visualize progress, PRs, and trends over time
- 🤖 **AI Coach** - Get personalized advice powered by GPT-4o
- 😴 **Biometrics Integration** - Track HRV, sleep, and recovery metrics
- 🎯 **Periodization Support** - Follow structured training phases
- 👤 **Guest Mode** - Try the app without creating an account

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (Email + Google OAuth)
- **AI:** OpenAI GPT-4o via Vercel AI SDK
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/workout-web.git
   cd workout-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Site URL (for OAuth redirects)
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   
   # OpenAI (for AI Coach)
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Scripts

```bash
# Development
npm run dev          # Start dev server

# Building
npm run build        # Production build
npm run start        # Start production server

# Testing
npm run test         # Run all tests
npm run test:watch   # Watch mode
npm run test:coverage # With coverage report

# Code Quality
npm run lint         # ESLint
npm run type-check   # TypeScript check
```

## Project Structure

```
workout-web/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── (dashboard)/     # Protected dashboard routes
│   │   ├── api/             # API routes
│   │   ├── auth/            # Auth callback
│   │   └── login/           # Login page
│   ├── components/          # React components
│   ├── lib/                 # Utility libraries
│   │   ├── ai/              # AI tools and prompts
│   │   └── validation.ts    # Zod schemas
│   └── utils/
│       └── supabase/        # Supabase client setup
├── tests/                   # Test suites
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   └── security/            # Security tests
├── docs/                    # Documentation
└── .github/
    └── workflows/           # CI/CD pipelines
```

## Database Schema

Key tables in Supabase:

| Table | Description |
|-------|-------------|
| `profiles` | User profiles and settings |
| `logs` | Workout performance logs |
| `workout_sessions` | Session metadata |
| `pr_history` | Personal record tracking |
| `biometrics` | Health metrics (HRV, sleep, etc.) |
| `sleep_logs` | Sleep-specific data |
| `readiness_logs` | Daily readiness scores |

All tables have Row Level Security (RLS) enabled.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `NEXT_PUBLIC_SITE_URL` | Yes | Production URL for OAuth |
| `OPENAI_API_KEY` | Yes | OpenAI API key for AI Coach |

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Supabase Configuration

1. Add production URL to Authentication → URL Configuration
2. Enable leaked password protection
3. Configure Google OAuth provider with production credentials

## Testing

The project includes comprehensive test coverage:

- **216 tests** across 5 test files
- Validation, database operations, API routes
- Security tests for auth and AI
- Run with `npm run test`

## Security

- ✅ Row Level Security on all tables
- ✅ Input validation with Zod
- ✅ Rate limiting on AI endpoints
- ✅ Prompt injection detection
- ✅ Content moderation
- ✅ CSRF protection via Supabase

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests (`npm run test`)
5. Submit a pull request
