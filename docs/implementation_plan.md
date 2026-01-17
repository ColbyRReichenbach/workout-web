# Implementation Plan: Hybrid Athlete Data Architecture

## 1. The Challenge: Data Complexity
The "Hybrid Athlete Life Plan" introduces three distinct data types that standard workout loggers fail to capture simultaneously:
1.  **Strength (Linear):** Sets, Reps, Weight, RPE (Standard).
2.  **Endurance (Continuous):** Duration, Distance, Avg HR, Max HR, Zone Distribution.
3.  **MetCon (Complex/Mixed):** Rounds, Time-to-Complete, Split Times, Specific Rep counts (Chesterfield style).

Additionally, the **Block Periodization** requires a "Meta-Layer" of logic to handle transitioning between phases (Volume -> Strength -> Peak) and the specific progression rules (e.g., "Add 5lbs vs Add 5 mins").

## 2. Updated Database Schema Strategy

### A. `workout_library` (The Template Engine)
The current JSON `phases` structure is a good start but needs to be strict.
*   **Structure:** `Phase -> Week -> Day -> Segments`
*   **Polymorphic Segments:** Each "Exercise" entry needs a `type`:
    *   `STRENGTH`: { weight_percent: 0.7, reps: 8, sets: 3 }
    *   `CARDIO_STEADY`: { duration: 30, zone: 2 }
    *   `CARDIO_INTERVAL`: { sets: 5, distance: 500, rest: 60 }
    *   `METCON`: { scheme: "AMRAP", time_cap: 20, movements: [...] }

### B. `logs` (The Flexible Recorder)
We will move from rigid columns (`sets`, `reps`) to a `jsonb` column called `performance_data` to handle the variety.

**Mapping:**
*   **Squat:** `performance_data = { "sets": [ {"reps":8, "weight":240, "rpe":7}, ... ] }`
*   **Zone 2 Run:** `performance_data = { "duration": "35:00", "avg_hr": 148, "distance_miles": 4.2 }`
*   **Intervals:** `performance_data = { "splits": [ "2:14", "2:16", ... ] }`

### C. The "Apple Health" Gap (The Manual Input Reality)
Since we are a Web App, we cannot auto-sync HealthKit yet.
*   **Solution:** The Frontend `Log` interface must change based on the workout type.
    *   *Strength UI:* Standard input fields for Weight/Reps.
    *   *Cardio UI:* Time/Distance inputs + HR input (User looks at Watch, types in Avg HR).

## 3. Implementation Steps (Revised)

## 3. Implementation Steps (Current Status)

### ✅ Step 1: Schema Migration
*   **Status:** Complete.
*   `workout_library`: Stores the polymorphic "Hybrid Life Plan" JSON tree.
*   `logs`: Converted to support `jsonb` performance data and `tracking_mode`.

### ✅ Step 2: The "Smart" Dashboard UI
*   **Status:** Complete.
*   Dashboard dynamically renders:
    *   *Warmups* as Checkboxes.
    *   *Lifts* as Weight/Rep inputs.
    *   *Cardio* as HR/Time inputs.
    *   **Auto-Calculation:** Displays target weights (e.g., 240lbs) based on Profile Maxes.

### ✅ Step 3: Data Capture (Waring up the Dashboard)
*   **Status:** Complete.
*   `logSegment` function writes normalized data (Checkbox, Detailed, Input) to Supabase.
*   "Optimistic UI" provides instant feedback (green checkmark).

### ✅ Step 4: AI Progression Logic (Workflow C)
*   **Status:** Complete.
*   **Backend:** `/api/chat` route created with `streamText` and access to `routine_master_plan.md` as System Prompt.
*   **Tools:** `getRecentLogs` and `getBiometrics` implemented to give LLM context.
*   **Frontend:** `AiCoach.tsx` chat interface integrated into the Dashboard.

### ✅ Step 5: "Kinetic Glass" & Feature Expansion
*   **Goal:** Implement the S.P.E.C. Visual Strategy (Apple-like fluidity) + PR Tracking.
*   **Status:** Complete.
*   **Task 5.1:** Implement `WeeklyStrip` (Visual Calendar) on Dashboard. (Done)
*   **Task 5.2:** Build `PreFlight` (Recovery check) and `PostFlight` (Notes/Tags) modals for `/workout`. (Done)
*   **Task 5.3:** Create "Gold Star" PR Logic (frontend detection + writing to `pr_history`). (Done)
*   **Task 5.4:** Profile Page Update: Add inputs for Mile / 5k / Sprint times. (Done)

## 4. Why This Architecture?
*   **Flexibility:** JSONB allows us to track "Rounds of Wallballs" today and "1RM Snatch" tomorrow without altering the DB schema.
*   **Scalability:** When we eventually build the iOS companion app, the API simply dumps the HealthKit JSON payload directly into `performance_data`.
