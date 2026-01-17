# Workflow C: The AI "Adaptive Coach" Blueprint

## 1. System Architecture
The "Adaptive Coach" is an LLM-driven agent (using Vercel AI SDK) that lives at `/api/chat`. It acts as the bridge between the **Static Plan** and the **Dynamic Reality**.

### The Core Loop
1.  **Context Injection:**
    *   The AI is *always* fed the content of `routine_master_plan.md` as its "Constitution".
    *   It is forbidden from suggesting deviations unless constraints (injury, severe fatigue) are met.

2.  **Tool-Use (MCP Style):**
    *   The AI cannot "guess" your logs. It must use tools to fetch them.
    *   **`get_recent_logs(days: 7)`**: returns the JSONB `performance_data` for the last week.
    *   **`get_biometrics()`**: returns sleep/HRV data.

3.  **Reasoning Engine:**
    *   **Constraint Checking:** "User reported HR 165 in Zone 2 run." -> *Comparison against Master Plan* ("Constraint: 160 max") -> *Verdict:* "Violation."
    *   **Progression Logic:** "User hit 3x8 @ 240lbs easily (RPE 6)." -> *Logic:* "Next week add 5lbs."

## 2. Implementation Steps

### Step C.1: The AI Route (`src/app/api/chat/route.ts`)
*   Initialize `streamText` from `ai` package.
*   Define the `system` prompt with the text of `routine_master_plan.md`.
*   Define the `tools` definition.

### Step C.2: The Tools (`src/lib/ai/tools.ts`)
*   **`queryLogs`**: A server-side function that runs a Supabase RPC or Select query to grab rows from `public.logs`.
    *   Returns formatted strings: "Monday: Squat 3x8 @ 240lbs (Completed)".

### Step C.3: The "Coach" Interface
*   Add a floating "Ask Coach" button or a dedicated section on the Dashboard.
*   The user can ask: "Am I ready for the heavy session?"
*   The AI calls `get_biometrics()`, sees HRV is low, checks `routine_master_plan.md` rule for fatigue, and advises: "Switch to the 'Active Flush' protocol."

## 3. Example Scenario: "The Knee Pain"
1.  **User:** "My knee hurts a bit today."
2.  **AI (Internal):**
    *   *Scan Plan:* Today is "Monday: Heavy Lower".
    *   *Constraint Check:* Knee pain + Heavy Squat = BAD.
    *   *Search Modification:* Look for "Deload" or "Washout" protocols in Master Plan.
3.  **AI (Output):** "I'm modifying today's session. We are swapping 'Low Bar Back Squat' for 'Box Squats (Light)' and removing the Lunges. Focus on the extensive warm-up."
4.  **AI (Action):** Calls `update_todays_workout(...)` (Future capability).
