# Hybrid Athlete Analytics Intelligence Report

## Executive Summary

After analyzing the **32-week Hybrid Athlete "Life Plan"** and the comprehensive tracking architecture, I've identified that the current analytics approach (raw tonnage over time) is **fundamentally flawed** for this program. The plan is periodized with distinct physiological goals per phase, meaning raw volume is an **expected outcome**, not an insight.

This report provides a **phase-dynamic analytics framework** that delivers actionable intelligence based on what actually matters in each training block.

---

## Core Philosophy: Measure Adaptation, Not Activity

**The Problem with Tonnage Charts:**
- Week 1-8 (Aerobic Base): Low weight, high volume → Low tonnage
- Week 9-20 (Strength): High weight, moderate volume → High tonnage
- Week 21-32 (Peak): Max weight, low volume → Variable tonnage

**Result:** A tonnage chart just shows "we lifted heavier weights" — which is the plan, not a performance insight.

**The Solution:** Track **efficiency of adaptation** within each phase's specific stimulus.

---

## Phase-Specific Analytics Framework

### **PHASE 1: Aerobic Base & Structural Integrity (Weeks 1-8)**

**Primary Goal:** Expand aerobic capacity while minimizing cardiac drift.

#### **Visualization 1: Aerobic Efficiency Curve**
- **X-Axis:** Week (1-8)
- **Y-Axis (Primary):** Speed/HR Ratio (mph per bpm)
- **Y-Axis (Secondary - Dotted):** Average HR during Zone 2 sessions
- **Insight:** Are you running faster at the same heart rate? This proves aerobic engine expansion.
- **Data Source:** `logs.performance_data.avg_hr`, `logs.performance_data.distance`, `logs.performance_data.duration_min` where `tracking_mode = 'CARDIO_BASIC'` and `phase_id = 1`

**Why This Matters:** If your Week 8 pace is 9:30/mile at 150 bpm vs. Week 1's 10:30/mile at 155 bpm, you've built a bigger engine. Raw "miles run" doesn't tell this story.

#### **Visualization 2: Structural Load Tolerance**
- **Format:** Heatmap Calendar (7x8 grid = 8 weeks)
- **Color Scale:** Green (session completed), Yellow (modified), Red (skipped), Blue (deload week)
- **Overlay:** Readiness score as opacity (darker = higher readiness)
- **Insight:** Did you maintain consistency without overreaching?
- **Data Source:** `logs.date`, `readiness_logs.readiness_score`

---

### **PHASE 2: Strength & Threshold (Weeks 9-20)**

**Primary Goal:** Increase force production and lactic tolerance.

#### **Visualization 3: Relative Intensity Progression**
- **X-Axis:** Week (9-20)
- **Y-Axis:** Average % of Estimated 1RM per work set
- **Calculation:** For each main lift (Squat, Bench, Deadlift), calculate `(set_weight / estimated_1RM) * 100`
- **Insight:** Are you lifting at higher percentages of your max? This shows CNS adaptation, not just "more weight."
- **Data Source:** `logs.performance_data.sets` where `segment_name IN ('Back Squat', 'Bench Press', 'Deadlift')` and `phase_id = 2`

**Why This Matters:** If you're doing 5x3 @ 295 lbs in Week 9 (85% of 345 lb max) and 5x3 @ 315 lbs in Week 16 (91% of new estimated 350 lb max), you've increased neural efficiency.

#### **Visualization 4: Lactic Threshold Drift**
- **X-Axis:** Week (9-20)
- **Y-Axis (Primary):** Pace during threshold intervals (min/mile)
- **Y-Axis (Secondary - Area Fill):** HR Zone 4 time (minutes)
- **Insight:** Are you sustaining faster paces in Zone 4 without HR creep?
- **Data Source:** `logs.performance_data` where `segment_name LIKE '%Threshold%'` or `tracking_mode = 'CARDIO_INTERVALS'`

---

### **PHASE 3: The Peak (Weeks 21-32)**

**Primary Goal:** Maximize power output and secure PRs.

#### **Visualization 5: PR Timeline & Proximity**
- **Format:** Horizontal timeline with lift icons
- **Markers:** Each PR attempt (success = filled circle, failure = hollow)
- **Proximity Indicator:** Distance from current max (e.g., "Squat: 335 lbs → Target: 350 lbs = 15 lbs gap")
- **Insight:** Visual momentum toward peak performance.
- **Data Source:** `pr_history` table (if exists) or derived from `logs.performance_data.sets` max weights

#### **Visualization 6: Power Output Density**
- **X-Axis:** Week (21-32)
- **Y-Axis:** Watts (for bike sprints) or Velocity (for Olympic lifts)
- **Format:** Scatter plot with trend line
- **Insight:** Is peak power increasing even as volume decreases?
- **Data Source:** `logs.performance_data.watts` (Assault Bike) or `logs.performance_data.bar_speed` (if tracked)

---

## Phase-Agnostic (Universal) Analytics

### **Visualization 7: Recovery Debt Index**
- **Format:** Dual-axis area chart
- **X-Axis:** All 32 weeks
- **Y-Axis (Primary - Red Area):** Weekly Training Stress Score (TSS) — calculated from volume × intensity
- **Y-Axis (Secondary - Blue Line):** Recovery Score (Sleep Quality × Readiness)
- **Crossover Zones:** When red area exceeds blue line = accumulating fatigue
- **Insight:** Are you recovering faster than you're stressing the system?
- **Data Source:** `logs` (for TSS), `sleep_logs.asleep_minutes + sleep_logs.hrv_ms`, `readiness_logs.readiness_score`

**Why This Matters:** This is the **only** chart that should span all 32 weeks because recovery is phase-independent.

### **Visualization 8: Sleep Architecture Stability**
- **Format:** Line chart with confidence band
- **X-Axis:** All 32 weeks
- **Y-Axis:** Average sleep duration (hours)
- **Confidence Band:** ±1 standard deviation (shows consistency)
- **Overlay:** HRV trend line
- **Insight:** Is sleep quality degrading as training intensifies?
- **Data Source:** `sleep_logs.asleep_minutes`, `sleep_logs.hrv_ms`

---

## Dynamic Dashboard Logic

### **The "Current Phase" Intelligence Panel**

**IF Phase 1 (Weeks 1-8):**
- **Hero Metric:** "Aerobic Efficiency: +14.2%" (speed/HR improvement)
- **Primary Chart:** Aerobic Efficiency Curve
- **Secondary Chart:** Structural Load Tolerance Heatmap

**IF Phase 2 (Weeks 9-20):**
- **Hero Metric:** "CNS Intensity: 87% avg 1RM" (relative intensity)
- **Primary Chart:** Relative Intensity Progression
- **Secondary Chart:** Lactic Threshold Drift

**IF Phase 3 (Weeks 21-32):**
- **Hero Metric:** "Power Output: 982W peak" (max sprint watts)
- **Primary Chart:** PR Timeline & Proximity
- **Secondary Chart:** Power Output Density

**Always Visible (Sidebar):**
- Recovery Debt Index (mini version)
- Sleep Architecture Stability (last 14 days)
- Current Week Readiness Score (large number with color coding)

---

## Metrics That Should NOT Be Visualized

1. **Total Tonnage Over Time** → This is the plan, not an insight
2. **Total Workout Count** → Consistency is better shown via heatmap
3. **Calories Burned** → Irrelevant for hybrid performance
4. **Generic "Fitness Score"** → Too abstract without context

---

## Implementation Priority

### **Phase 1 (MVP):**
1. Recovery Debt Index (universal)
2. Current Phase Hero Metric (dynamic text)
3. Aerobic Efficiency Curve (Phase 1 only for now)

### **Phase 2:**
4. Relative Intensity Progression (Phase 2)
5. PR Timeline (Phase 3)
6. Sleep Architecture Stability

### **Phase 3:**
7. Structural Load Heatmap
8. Lactic Threshold Drift
9. Power Output Density

---

## Data Availability Check

**Currently in Database:**
- ✅ `logs.performance_data` (sets, reps, weight, distance, duration, HR)
- ✅ `sleep_logs` (asleep_minutes, HRV, resting HR)
- ✅ `readiness_logs` (readiness_score)
- ✅ `logs.phase_id` (for phase filtering)
- ⚠️ `pr_history` (may need to be derived from logs)
- ❌ `bar_speed` / `watts` (may need manual entry for Olympic lifts/sprints)

**Missing Data (Future Enhancement):**
- Estimated 1RM tracking (can be calculated from sets)
- Training Stress Score (TSS) — needs formula implementation
- Workout "feel" ratings (RPE at session level)

---

## Technical Implementation Notes

### **Calculation Formulas**

#### **Aerobic Efficiency Score**
```javascript
const efficiency = (distance_miles / (duration_minutes / 60)) / avg_hr * 1000;
// Normalized to 0-100 scale for display
```

#### **Relative Intensity (%1RM)**
```javascript
// Using Epley formula for estimated 1RM
const estimated1RM = weight * (1 + reps / 30);
const relativeIntensity = (set_weight / estimated1RM) * 100;
```

#### **Training Stress Score (TSS)**
```javascript
// Simplified version for hybrid training
const volumeLoad = sets.reduce((acc, s) => acc + (s.weight * s.reps), 0);
const intensityFactor = avg_weight / estimated1RM;
const TSS = (volumeLoad * intensityFactor) / 100;
```

#### **Recovery Score**
```javascript
const sleepScore = (asleep_minutes / 480) * 100; // % of 8h target
const hrvScore = (hrv_ms / 60) * 100; // normalized to 60ms baseline
const readinessScore = readiness_score; // already 0-100
const recoveryScore = (sleepScore * 0.4) + (hrvScore * 0.3) + (readinessScore * 0.3);
```

---

## Component Architecture

### **Recommended Component Structure**

```
src/components/analytics/
├── PhaseAwareChart.tsx          # Wrapper that switches charts based on phase
├── AerobicEfficiencyCurve.tsx   # Phase 1 primary
├── RelativeIntensityChart.tsx   # Phase 2 primary
├── PRTimeline.tsx               # Phase 3 primary
├── RecoveryDebtIndex.tsx        # Universal
├── SleepArchitecture.tsx        # Universal
└── HeatmapCalendar.tsx          # Phase 1 secondary
```

### **Data Fetching Strategy**

```typescript
// Server action for phase-specific data
export async function getPhaseAnalytics(phaseId: number, startWeek: number, endWeek: number) {
  const supabase = await createClient();
  
  // Fetch only relevant data for the current phase
  const { data } = await supabase
    .from('logs')
    .select('*')
    .eq('phase_id', phaseId)
    .gte('date', calculateWeekDate(startWeek))
    .lte('date', calculateWeekDate(endWeek));
    
  return processPhaseData(data, phaseId);
}
```

---

## Conclusion

The analytics tab should function as a **performance diagnostic tool**, not a workout diary. Each phase has a distinct physiological target, and the visualizations must prove whether that adaptation is occurring. 

**The Golden Rule:** If a metric is guaranteed to improve by following the plan (like tonnage), it's not worth visualizing. Only chart what reveals **how well** the adaptation is happening.

---

## Next Steps

1. ✅ Document created
2. ⏳ Implement Recovery Debt Index (MVP)
3. ⏳ Build phase detection logic
4. ⏳ Create Aerobic Efficiency Curve (Phase 1)
5. ⏳ Design phase-switching UI component
