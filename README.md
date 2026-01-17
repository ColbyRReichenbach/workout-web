# Pulse: The Hybrid Athlete Performance Tracker

Pulse is a high-performance web application designed for the modern hybrid athlete—those who balance elite-level strength with superior aerobic endurance. Built with a focus on precision tracking, biometric correlation, and progressive overload, Pulse transforms fragmented workout data into a unified performance baseline.

## ⚡ Core Philosophy
Elite performance is a byproduct of precision. Pulse is engineered to validate training stimuli through:
- **Biometric Correlation:** Integrates sleep, HRV, and readiness metrics (HealthKit) with session output.
- **Adaptive Progression:** Respects the current training phase (Structural Integrity, Strength/Threshold, Peak Power).
- **Density Tracking:** Monitors Metcon rounds/reps and interval splits to measure work capacity over time.

## 🛠 Tech Stack
- **Frontend:** [Next.js 15+](https://nextjs.org/) (App Router, React 19)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with a custom Glassmorphic Design System
- **Backend/DB:** [Supabase](https://supabase.com/) (PostgreSQL, Realtime, RLS)
- **State/Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/)

## 📈 Architecture & Logic
The project follows a strict relational architecture to handle multi-dimensional athlete data:
- `workout_sessions`: Consolidated mission headers for daily protocols.
- `logs`: High-resolution performance data (split-times, set-by-set load, RPE).
- `sleep_logs`: HealthKit-derived recovery intelligence.
- `readiness_logs`: AI-driven athlete readiness scoring.

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Supabase Project & API Keys

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   ```
4. Start the engine:
   ```bash
   npm run dev
   ```

## 📄 Documentation
Detailed guides are available in the `/docs` directory:
- [Routine Master Plan](./docs/routine_master_plan.md): The training blueprint.
- [Tracking Specification](./docs/tracked.md): Biometric and performance data definitions.
- [Technical Roadmap](./docs/product_roadmap.md): The path to V1.0.

---
**The resistance you face today is the foundation of the strength you reveal tomorrow.**
