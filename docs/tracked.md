# The Pulse Tracker: Digital Athlete Metrics Architecture

As your performance architect, I’ve mapped out the exact biometric and performance data required to verify your progression in the Hybrid Athlete "Life Plan." 

Tracking is not just about recording a session; it's about **validating the stimulus.** If the plan says "Zone 2," we must prove you stayed in the aerobic pocket. If the plan says "Max Effort," we need to see the precise failure point.

---

## 1. Resistance & Strength Training (Hypertrophy, Strength, Peak)
*Standard rule for Apple Health: Stronger/Apple Workouts will log your HR and "Total Work," but they are blind to your progressive overload. We must manually bridge the gap.*

### Core Metrics:
| Metric | Required For | Rationale |
| :--- | :--- | :--- |
| **Set-by-Set Weight** | Every Lift | To track intensity fluctuations (e.g., Set 4 fatigue). |
| **Set-by-Set Reps** | Every Lift | To verify if the prescribed volume was met (e.g., "5x3" becomes 3,3,3,2,1). |
| **Set-by-Set RPE** | Accessories | To ensure "Beach Finishers" or hyperthrophy sets hit the stimulus without CNS burnout. |
| **Rest Duration** | Main Lifts | Critical during Phase 2 (Heavy Lower) where 3-5m rest is mandatory for ATP recovery. |

### Edge Case: Warm-ups
*   **Warm-ups (Sets 1-2):** Record weight/reps for data continuity, but flag as "Warm-up" so they don't skew "Total Work Volume" charts.

---

## 2. Metabolic Conditioning (Metcons & CrossFit)
*Standard Metcon tracking in generic apps is notoriously bad. We need "Density Metrics."*

### Format: AMRAP (e.g., "Aerobic Flow" Phase 1)
*   **Total Rounds + Reps:** The primary score.
*   **Split Times:** Ideally, we track when each round was completed to see if you "started too hot" and fell off.
*   **Nasal Breathing Check:** A binary flag (Yes/No). If No, the intensity was too high for the Phase 1 stimulus.

### Format: For Time (e.g., "Lactic Bath" Phase 2)
*   **Total Time:** The primary score.
*   **Unbroken Notes:** Were the 15 wall balls unbroken? (e.g., Round 1: 15, Round 5: 8+7).
*   **Heat Rate (Max):** To verify we hit the 85-90% goal.

---

## 3. Endurance & Threshold (Runs, Rows, Bikes)
*HealthKit provides GPS and HR, but "Pacer Logic" requires manual validation.*

### Zone 2 (Steady State)
*   **Average HR:** Must stay within 146–160 bpm.
*   **Max HR:** If this hits 162+, the session is flagged as "Over-reached."
*   **Pace (Avg):** 10:30 -> 9:30 is our 6-month target.
*   **Distance:** Automated via GPS (HealthKit).

### Intervals (e.g., 400m Repeats, Row 500m)
*   **Split Time per Interval:** Essential to track "Drop-off."
*   **Recovery HR:** Did your HR drop below 140 bpm during the 1:00 rest? (Phase 1 Tuesday constraint).
*   **Power (Watts):** For Assault/Echo bike sprints (Phase 3 Monday). 1000W vs 800W is the difference between Alactic Power and Lactic Endurance.

---

## 4. The "Coach AI" Tracking Checklist (Session by Session)

| Workout Type | Primary Manual Inputs | HealthKit Sync Targets |
| :--- | :--- | :--- |
| **Mon: Strength** | Set-by-Set Load/Reps/RPE | Avg HR, Recovery HR |
| **Tue: Intervals** | Split Times, Rest HR | Max HR, Laps, GPS Map |
| **Wed: Zone 2** | *None (Low friction)* | Avg HR (Strict Pocket), Distance, Pace |
| **Thu: Metcon** | Score (Rounds/Reps), Round Splits | HR Zone Distribution (Time in Z4/Z5) |
| **Sat: Long Day** | Total Calories (Row/Bike), Machine Split | Total Duration, Total HR Load |

---

## 5. Technical Implementation Guidance (Edge Cases)

1.  **Machine Rows/Bikes:** Apple Watch "Indoor Row" is highly inaccurate for distance. **Manual Input** for total meters/calories is required.
2.  **Olympic Lifts (EMOM):** Track as **Success/Fail** per minute. Metadata should include "Technique Feel" (1-5 scale) rather than just weight.
3.  **The Murph (Saturday Phase 3):** Needs specific partitioning tracking (e.g., "5-10-15" vs "Unbroken Large Sets") as this changes the metabolic demand.
4.  **Failure Logic:** If a user misses a rep in a 5x3, the app should prompt for a "Reason for Failure" (Technical vs. Strength vs. Fatigue) to allow the Coach AI to adjust the next week's load.

---
**Elite performance is a byproduct of precision. If we don't track the detail, we can't manage the outcome.**
