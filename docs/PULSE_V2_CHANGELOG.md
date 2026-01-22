# Pulse V2 Changelog

This document details the comprehensive updates included in the `pulse-v2` release.

## 1. Phase 5 & 52-Week Program Overhaul
- **Complete 52-Week Generation**: Updated `scripts/generate_52_weeks.js` to fully generate all 5 Phases of the training year.
    - **Phase 1**: Aerobic Base & Structural Integrity (Weeks 1-8)
    - **Phase 2**: Strength & Threshold (Weeks 9-20)
    - **Phase 3**: Peak Power (Weeks 21-32)
    - **Phase 4**: The Taper (Weeks 33-36)
    - **Phase 5**: Re-Calibration & Testing (Weeks 37-52)
- **Testing vs. Re-Entry**: Phase 5 now correctly alternates between "Testing Weeks" (Olympic/Structural Maxes) and "Re-Entry Weeks" (cycling through Phase 1 base patterns) to ensure safe volume ramp-up.
- **Dynamic Logic Preserved**: All dynamic tokens (e.g., `{{zone_2_hr}}`) are preserved in the JSON output for frontend resolution.

## 2. Weight Percentage Recalibration
Following a safety and efficacy audit, several accessory lifts in **Phases 1, 2, and 5** were recalibrated to safer hypertrophy ranges.
- **Walking Lunges**: Reduced from 20% to **10%** of Squat Max (per hand).
- **Pendlay Rows**: Reduced from 70% to **50%** of Bench Max (Strict form focus).
- **DB Press (Superset)**: Reduced from 25-30% to **20%** of Bench Max.
- **Bulgarian Split Squats**: Reduced from 25% to **12.5%** of Squat Max (per hand).
- **Single Arm Row**: Reduced from 30% to **20%** of Deadlift Max.

*Note: All dual-hand exercise notes were updated to explicitly state "Weight per hand" to avoid user confusion.*

## 3. Database Synchronization & Tooling
- **Incremental Update Script**: Added a `--update-db` flag to `scripts/generate_52_weeks.js`.
    - This allows developers to regenerate the program JSON and immediately sync it to Supabase using local credentials (`.env.local`), handling duplicate cleanup automatically.
- **Sleep Data Synthesis**: Created `scripts/synthesize_sleep.js` to backfill missing sleep logs for analytics continuity (specifically filling the gap up to Week 20/Jan 22, 2026).

## 4. UI/UX Improvements
- **Workout Card Redesign**:
    - Refactored `src/app/(dashboard)/workout/page.tsx` to move segment descriptions/details to a dedicated full-width section at the bottom of the card.
    - This solves layout issues where long text (e.g., complex Cardio/MetCon instructions) was being squeezed into narrow grid columns.
- **Dynamic Target Support**: Updated the frontend to correctly interpret and display new numeric targets, including derived decimal percentages (e.g., `progressions`) and per-hand calculations.
