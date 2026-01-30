# PR Correlation & Estimation Logic

This document outlines the scientific and academic basis for calculating missing performance records (PRs) based on known benchmarks. These correlations ensure that every Pulse athlete has a complete training profile from day one.

## 1. Anchor Lift Logic

Pulse uses **Back Squat** and **Bench Press** as the two primary anchors for all strength estimations.

| If User Has... | Estimation Strategy |
| :--- | :--- |
| **Both Squat & Bench** | **Lower Body** (Deadlift, Front Squat) $\rightarrow$ based on Squat. <br> **Upper Body** (OHP, C&J, Snatch) $\rightarrow$ based on Bench. |
| **Only Squat** | All lifts estimated from Squat (Lower at 100% logic, Upper at 60-70% cross-correlation). |
| **Only Bench** | All lifts estimated from Bench (Upper at 100% logic, Lower at 130-150% cross-correlation). |

---

## 2. Strength Correlates

### Lower Body (Anchored to Back Squat)
| Exercise | Ratio | Rationale |
| :--- | :--- | :--- |
| **Deadlift** | 120% | Mechanical advantage of the posterior chain. |
| **Front Squat** | 85% | Quadriceps specificity. |

### Upper Body & Olympic (Anchored to Bench Press)
| Exercise | Ratio | Rationale |
| :--- | :--- | :--- |
| **OHP** | 60% | Structural overhead stability relative to horizontal pressing. |
| **Clean & Jerk** | 110% | Bench is a strong proxy for the Jerk capacity and general upper body rigidity. |
| **Snatch** | 80% (of C&J) | Snatch is typically 80% of the calculated C&J max. |

---

## 3. Power & Endurance Correlates

### Air Bike (Assault/Echo)
*   **Metric:** `bike_max_watts`
*   **Estimation:** If unknown, estimated at **3.0 $\times$ Back Squat** (lbs).

### Running (Jack Daniels VDOT)
*   **Mile Time** $\rightarrow$ Primary Anchor for all run distances.
*   **5k Time** = Mile $\times$ 3.1 $\times$ 1.15.
*   **400m Sprint** = (Mile / 4) - 5 seconds.

### Rowing & Ski
*   **2000m Row** $\rightarrow$ Primary Anchor.
*   **500m Row** = (2k / 4) - 5 seconds split.
*   **1k Ski** = 1k Row Split + 10 seconds.

---

## 4. Tracked Fields Coverage

The following fields are covered by the Pulse Intelligence estimation engine:
- `squat_max`, `bench_max`, `deadlift_max`, `front_squat_max`
- `ohp_max`, `clean_jerk_max`, `snatch_max`
- `bike_max_watts`
- `mile_time_sec`, `k5_time_sec`, `sprint_400m_sec`
- `row_2k_sec`, `row_500m_sec`, `ski_1k_sec`
- `zone2_pace_per_mile_sec`, `tempo_pace_per_mile_sec`, `zone2_row_pace_500m_sec`

---

## 5. Implementation Strategy

### The "Pulse Reveal"
During onboarding, after the user inputs their known PRs, Pulse Intelligence will:
1. Identify available anchors.
2. Calculate missing metrics using the ratios above.
3. Present the estimated profile to the user for validation.
4. Flag estimated loads in the workout view with an `(est.)` badge.
