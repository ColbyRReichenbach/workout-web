# Pulse V2: Architectural Overhaul & Changelog

This release marks a fundamental shift in the *Pulse* architecture, moving from a static, hardcoded routine to a fully dynamic, user-responsive training ecosystem.

## 1. Core Philosophy: From Static to Dynamic
The original system relied on **hardcoded values** (e.g., "Row at 2:00/500m" or "Bench 135lbs"). This worked for a specific moment in time but failed to adapt as the athlete became stronger or faster.
*   **Old Way**: Static text strings that became obsolete after a few weeks of progress.
*   **Pulse V2**: A living system that calculates every target based on the user's *current* capabilities. As you hit new PRs, the entire 52-week program instantly recalibrates to push you further.

## 2. Workout Logic & Progression
We have replaced arbitrary weight assignments with precision calculations derived from your 1RM and Benchmark stats.

| Feature | Previous "Hardcoded" State | Pulse V2 "Dynamic" State |
| :--- | :--- | :--- |
| **Strength Load** | "3 sets of 10 @ 135lbs" | **`70% 1RM`** (Calculates 205lbs automatically if Max is 295) |
| **Cardio Paces** | "Run at 8:00/mile" | **`{{zone_2_pace}}`** (Resolves to 7:45 or 8:15 based on latest 5k) |
| **Progression** | Manual Excel updates required | **Auto-Regulating**: Hitting a PR update instantly updates all future weeks. |

## 3. Database Architecture Changes
We moved away from storing "display text" to storing "logic tokens."
*   **Before**: The database stored literal strings like `"Zone 2 Run (8:00 pace)"`.
*   **After**: The database stores **structured JSON segments** with tokenized details:
    ```json
    {
      "segment": "Zone 2 Run",
      "target": { "details": "Target: {{zone_2_pace_mile}}" }
    }
    ```
    The frontend converts `{{zone_2_pace_mile}}` into a real number at render time.

## 4. Codebase Logic Updates
*   **`generate_52_weeks.js`**: Now the "Brain" of the operation. It programmatically builds the entire year, injecting logic hooks instead of flat text.
*   **Frontend Rendering (`workout/page.tsx`)**:
    *   **Dynamic Resolution Engine**: Added logic to parse user profile stats (`mile_time_sec`, `squat_max`, etc.) and inject them into workout cards in real-time.
    *   **Unified UI**: Refactored workout cards to handle variable text lengths gracefully by moving details to a dedicated bottom section.

## 5. Recalibration & Safety Audit
To support this dynamic scaling, we audited the baseline percentages to ensure they remain safe even as users get stronger.

*   **Accesory Lifts**: Reduced from aggressive strength % to hypertrophy ranges.
    *   *Lunges*: 20% → **10%** (Safety & Stability)
    *   *Rows*: 70% → **50%** (Form focus)
    *   *Split Squats*: 25% → **12.5%** (Unilateral balance)

## 6. The "Update Flag"
Added a developer tool to `scripts/generate_52_weeks.js`:
*   Running `node scripts/generate_52_weeks.js --update-db` now instantly:
    1.  Compiles the latest logic.
    2.  Connects to Supabase.
    3.  Patches the live program without downtime.

