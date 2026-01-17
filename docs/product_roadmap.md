# S.P.E.C. Tracker - Product Roadmap & Brainstorm
*A living document defining the "Ideal State" of the Hybrid Athlete OS.*

## 1. Core Philosophy: "Context-Aware & Adaptive"
The app shouldn't just be a spreadsheet. It must understand **context** (Periodization Phase, Daily Readiness) and **adaptation** (AI adjustments).

---

## 2. Site Architecture & Feature Map

### A. The Command Center (`/`)
* **Purpose:** The "Pilot's Cockpit". High-level status, immediate actions, and AI Briefing.
* **Key Features:**
    * **Daily Briefing (AI):** "Your HRV is low (34ms). I've reduced today's Squat volume by 15%."
    * **The "Hybrid Score":** A composite score (0-100) combining Strength Standards and Cardio Capacity.
    * **Weekly Calendar:** Visual timeline of the week (Past days = Checked/Missed, Future = Planned).
    * **"Go Button":** Prominent CTA to start the active session.

### B. The Workout Lab (`/workout`)
* **Purpose:** Deep execution mode. Zero distractions.
* **Pre-Flight Check:**
    * **Sleep/Recovery Input:** "Hours slept?", "Soreness level?" (AI uses this *before* unlocking the workout).
    * **Readiness Check:** Simple 1-5 scale or import from Apple Health/Oura.
* **Execution Interface (The Cards):**
    * **Smart Substitution:** If a user checks "Knee Pain" during Pre-Flight, the AI swaps "Back Squat" for "Box Squat" dynamically.
    * **RPE Tracker:** Every lift needs an RPE (1-10) field.
* **Post-Flight Debrief:**
    * **Session RPE:** "How hard was the total session?"
    * **Subjective Notes:** "Squats felt heavy, didn't eat enough beforehand." (Critical for AI context).

### C. Dynamic Analytics (`/analytics`)
* **Philosophy:** The dashboard adapts to the **Current Phase**.
* **Phase 1: Base & Hypertrophy**
    * *Highlight:* **Volume Load (Tonnage)** and **Zone 2 Duration**.
    * *Chart:* Monthly Volume trends.
* **Phase 2: Strength & Power**
    * *Highlight:* **Intensity (% of 1RM)** and **Force Output**.
    * *Chart:* Est. 1RM progression on Big 3.
* **Phase 3: Peak / Hybrid Expression**
    * *Highlight:* **Recovery Score** and **Race Pace / Specificity**.
    * *Chart:* Tapering volume vs. Performance markers.

### D. The Athlete Profile (`/profile`)
* **Purpose:** The "Physical Truth".
* **Data Points:**
    * **Absolute Maxes:** (Squat, Bench, Deadlift, OHP).
    * **Running Thresholds:** (Zone 2 Pace, 5k Pace, Max HR).
    * **Biometrics:** Bodyweight, Sleep Baseline, Body Fat %.
* **Feature:** **"Standards Comparison"**: Compare user stats against "Elite Hybrid Standards" (e.g., 2.5x BW Deadlift + Sub-20min 5k).

### E. System Settings (`/settings`)
* **Purpose:** App configuration (kept separate from Profile).
* **Features:**
    * **AI Personality:** (Drill Sergeant vs. Analytical Scientist).
    * **Hardware Integrations:** (Connect to Oura, Whoop, Apple Health).
    * **Unit Preferences:** (Lbs/Kg, Miles/Km).

---

## 3. The "AI Feedback Loop" Workflow
This is the "Secret Sauce" that makes the app meaningful.

1.  **Morning:** User inputs Sleep/HRV (or auto-sync).
2.  **AI Analysis:** Checks Phase rules.
    *   *Scenario:* Phase = Strength. HRV = Low.
    *   *Action:* AI modifies today's `/workout` payload (Reduces sets from 5 to 3).
3.  **Workout:** User logs weights + **Notes** ("Felt dizzy on last set").
4.  **Debrief:** AI reads notes.
    *   *Insight:* "Dizziness might be hydration or fatigue. I am flagging 'Hydration' for tomorrow's briefing."
5.  **Adaptation:** Next week's weights are calculated not just linearly/percentage-wise, but adjusted by the RPE of this week.

---

## 4. Next Implementation Steps (Proposed)
1.  **Refine `/workout`:** Add the "Pre-Flight" (Recovery) and "Post-Flight" (Notes) sections.
2.  **AI "Interceptor":** Build the logic where AI modifies the workout *before* the user sees it.
3.  **Build `/analytics`:** Create the Phase-Aware dashboard components.
