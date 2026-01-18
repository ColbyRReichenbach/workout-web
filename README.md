<div align="center">

# Pulse

**A performance-focused workout tracking application for hybrid athletes**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[Live Demo](https://pulse-workout.vercel.app) · [Report Bug](https://github.com/ColbyRReichenbach/workout-web/issues) · [Request Feature](https://github.com/ColbyRReichenbach/workout-web/issues)

</div>

---

## About

Pulse is a full-stack workout tracking application designed for athletes who train across multiple modalities—strength, conditioning, and recovery. It correlates biometric data (sleep, HRV, readiness) with session output to surface actionable insights across periodized training blocks.

Built as a personal tool with production-grade architecture, demonstrating modern web development patterns including server components, row-level security, and real-time data synchronization.

### Built With

- [Next.js 15](https://nextjs.org/) — React framework with App Router
- [Supabase](https://supabase.com/) — PostgreSQL database with authentication
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first styling
- [Framer Motion](https://www.framer.com/motion/) — Animation library
- [Vercel AI SDK](https://sdk.vercel.ai/) — AI-powered coaching features

---

## Features

| Feature | Description |
|---------|-------------|
| **Phase-Aware Programming** | Supports periodized training blocks (Structural, Strength, Peak) |
| **Biometric Integration** | Correlates HealthKit sleep/HRV data with performance output |
| **Session Logging** | Set-by-set tracking with RPE, load, and volume calculations |
| **Analytics Dashboard** | Tonnage trends, PR proximity, and recovery index visualization |
| **AI Coach** | Contextual guidance based on training phase and biometric state |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ColbyRReichenbach/workout-web.git
   cd workout-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

---

## Project Structure

```
pulse/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/        # Authenticated routes
│   │   ├── actions/            # Server actions
│   │   └── api/                # API routes
│   ├── components/             # Reusable UI components
│   ├── lib/                    # Types and utilities
│   └── utils/                  # Supabase client configuration
├── public/                     # Static assets
└── supabase/                   # Database migrations (gitignored)
```

---

## Roadmap

- [x] Core workout logging
- [x] Analytics dashboard
- [x] AI coaching integration
- [ ] Apple Watch companion app
- [ ] Multi-user team features
- [ ] Advanced periodization templates
- [ ] Export and reporting

See the [open issues](https://github.com/ColbyRReichenbach/workout-web/issues) for a full list of proposed features.

---

## Contributing

Contributions are welcome. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

## Contact

Colby Reichenbach — [GitHub](https://github.com/ColbyRReichenbach)

Project Link: [https://github.com/ColbyRReichenbach/workout-web](https://github.com/ColbyRReichenbach/workout-web)
