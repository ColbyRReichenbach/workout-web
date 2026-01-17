# S.P.E.C. Visual & Technical Implementation Strategy
*Combining "Apple-Like" Fluidity with Hybrid Athlete Functionality*

## 1. The Design Logic: "Kinetic Glass"
The visual language will be **"Kinetic Glass"**. It marries the depth/blur of Apple's visionOS with the high-energy responsiveness of a fitness tool.

### A. Core Visual Design Tokens
*   **Physics-Based Motion:** No linear animations. Everything uses `spring` physics (mass, stiffness, damping) via Framer Motion. Elements shouldn't just "move"; they should feel like they have *weight*.
*   **Depth & Light:**
    *   **Cards:** `backdrop-blur-xl`, `bg-white/5` (or black/40), and a subtle `border-white/10`.
    *   **Focus State:** When hovered, cards don't just lift (y-axis); they scale slightly (`scale: 1.02`) and the border brightens (`border-white/20`).
    *   **The "Bulge":** On hover, use a subtle 3D tilt effect (parallax) to make cards feel like physical bubbles.
*   **Visual Feedback:**
    *   **Snappy Interactions:** Buttons must press in (`scale: 0.95`) instantly on click.
    *   **Completion:** When a day is marked "Done", a *burst* of particles or a satisfying "fill" animation triggers immediately.

---

## 2. Feature Implementation Detail

### Feature 1: The "Weekly Strip" (Command Center)
*   **Visuals:** A horizontal strip of 7 distinct "bubbles" (days) at the top of the dashboard.
*   **Logic:**
    *   **State:** Each bubble has 3 states: `Pending` (Empty Ring), `Completed` (Filled Yellow/Gold), `Missed` (Red Dash).
    *   **Auto-Refresh:** On Sunday night at 23:59, the strip cycles. The "History" is pushed to the permanent Long-Term Calendar (Analytics), and the strip resets for the new week.
*   **Interaction:** Clicking a past day shows a "Mini Summary" popover of what was done.

### Feature 2: Auto-PR Tracking & The "Star" System
*   **Visuals:**
    *   **The Gold Star:** If a user logs a number > their stored `profile_max`, the card explodes with a Gold Star animation.
    *   **The PR Badge:** A small, shining badge appears next to the set in the log history.
*   **Logic:**
    *   **1RM Inference:** In `profile`, we store `1RM`. If user logs `315 x 5`, we calculate implied 1RM (`315 / (1.0278 - (0.0278 * 5))`). If Implied > Stored, we prompt: *"New Projected Max detected! Update Profile?"*
    *   **Splits:** In `profile`, we add fields for: `1 Mile`, `5k`, `400m Sprint`. We can infer `10k` pace from `5k` time using Riegel's formula.

### Feature 3: The "Pre-Flight" & "Post-Flight" Notes
*   **Visuals:**
    *   **Pre-Flight:** A modal that "slides up" from the bottom (Sheet UI) when you click "Start Workout". It asks: *Sleep (Slider)*, *Soreness (Body Map selector)*.
    *   **Post-Flight:** A text area that expands as you type, with "Quick Tags" chips (bubble buttons) below: `[Felt Heavy]`, `[Great Pump]`, `[Cardio was Hard]`.
*   **AI Integration:** The AI reads these tags + text to generate the next day's "Briefing".

---

## 3. Technical Framework (How We Build It)

### Stack Additions
*   **Framer Motion (Heavy Use):**
    *   `LayoutGroup` for shared element transitions (seamlessly moving a card from Dashboard to Workout page).
    *   `AnimatePresence` for smoother mounting/unmounting of modals (Pre-Flight check).
*   **Radix UI (Primitives):**
    *   Use Radix `Dialog` and `Popover` for accessible, unstyled bases that we wrap in our Glass/Motion styling.
*   **React Context for "Session State":** A global store to manage the "Active Workout" so timer/progress persists even if you navigate away to check Analytics.

### Database Schema Updates needed
1.  **`profile` Updates:** Add columns `mile_time_sec`, `5k_time_sec`, `sprint_400m_sec`.
2.  **`pr_history` Table:** Create a new table to track *when* a PR was broken to populate the "Calendar Stars".
    *   `id, user_id, date, exercise, value, type (weight/time)`.

---

## 4. Immediate Action Plan
1.  **Database Migration:** Add the new cardio fields to Profile and create the `pr_history` table.
2.  **Visual Component Library:** Build the `GlassCard` and `WeeklyStrip` components in isolation to perfect the "bounce" and "blur".
3.  **Refactor Dashboard:** Implement the Weekly Strip at the top of Command Center.
