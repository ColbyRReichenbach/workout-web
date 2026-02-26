"use client";

import { useEffect, useState } from "react";
import { Activity, Moon, Zap, Target, Shield, Flame } from "lucide-react";
import { getAnalyticsData } from "./actions";
import {
    PremiumAreaChart,
    ProgressionBarChart,
    StructuralHeatmap,
    RecoveryIndexChart,
    PRProximityChart
} from "@/components/AnalyticsCharts";
import { PRAnalysisModal } from "@/components/PRAnalysisModal";
import { PRHistory } from "@/components/PRHistory";
import { SleepAnalysisModal } from "@/components/SleepAnalysisModal";
import { useSettings } from "@/context/SettingsContext";
import { getUnitLabel, mapExerciseToBaseline } from "@/lib/conversions";


// BASELINE MAXES (from Master Plan) - DEPRECATED (Using Profile now)

interface SleepMetric {
    date: string;
    asleep_minutes: number;
    deep_sleep_minutes?: number;
    rem_sleep_minutes?: number;
    core_sleep_minutes?: number;
    awake_minutes?: number;
    hrv_ms: number;
    resting_hr: number;
    sleep_efficiency_score?: number;
    avg_hr_sleeping?: number;
    respiratory_rate?: number;
}

interface AnalyticsSet {
    weight?: number;
    reps?: number;
}

interface AnalyticsLog {
    date: string;
    week_number: number;
    day_name: string;
    tracking_mode?: string;
    performance_data?: {
        sets?: AnalyticsSet[];
        avg_hr?: number;
        distance?: string;
        duration_min?: string;
        weight?: number;
        reps?: number;
        rpe?: number;
        avg_watts?: string;
        rounds?: number;
        time_min?: number;
    };
    segment_name: string;
}

interface ReadinessMetric {
    date: string;
    readiness_score?: number;
}

interface HistoricalPR {
    id: string;
    exercise_name: string;
    value: number;
    unit: string;
    pr_type: string;
    created_at: string;
}

export default function AnalyticsPage() {
    const [data, setData] = useState<{
        rawLogs: AnalyticsLog[];
        rawSleepData: SleepMetric[];
        weeklyTonnage: number[];
        efficiencyIndex: number[];
        recoveryIndex: number[];
        systemStress: number[];
        cnsIntensity: number[];
        prs: Record<string, number>;
        currentPhase: number;
        currentWeek: number;
        readinessHistory: number[];
        activityHeatmap: boolean[];
        readinessHeatmap: number[];
        weeklyCardioDist: number[];
        aerobicVolume: number[];
        powerDensity: number[];
        readinessSurplus: number[];
        prMagnitude: number[];
        historicalPRs: HistoricalPR[];
        runningMaxes: Record<string, number>;
        // New real-data arrays
        squatWeeklyAvg: number[];
        benchWeeklyAvg: number[];
        zone2HrWeekly: number[];
        zone2DistWeekly: number[];
        metconHrWeekly: number[];
        singlesSquatPeak: number[];
        singlesDeadliftPeak: number[];
        zone1HrWeekly: number[];
        weeklyCardioMin: number[];
        weeklySessionCount: number[];
        fullArcSquatPeak: number[];
        fullArcBenchPeak: number[];
        totalCardioDist: number;
        totalPRsSet: number;
        oneRMResults: { name: string; value: number; unit: string; pctVsBaseline: number | null }[];
        profileMaxes: {
            squat_max?: number;
            bench_max?: number;
            deadlift_max?: number;
            ohp_max?: number;
            clean_jerk_max?: number;
            snatch_max?: number;
            mile_time_sec?: number;
            k5_time_sec?: number;
            sprint_400m_sec?: number;
            row_2k_sec?: number;
            row_500m_sec?: number;
            ski_1k_sec?: number;
            bike_max_watts?: number;
            zone2_pace_per_mile_sec?: number;
            tempo_pace_per_mile_sec?: number;
            zone2_row_pace_500m_sec?: number;
        };
    } | null>(null);

    const [viewMode, setViewMode] = useState<'tonnage' | 'cardio'>('tonnage');

    const { units } = useSettings();

    const [sleepModalOpen, setSleepModalOpen] = useState(false);
    const [prModalOpen, setPrModalOpen] = useState(false);
    const [prHistory, setPrHistory] = useState<HistoricalPR[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const raw = await getAnalyticsData();
            if (!raw) return;

            const profileWeek = raw.profile.currentWeek;

            const TOTAL_WEEKS = 52;
            let ANCHOR_DATE = new Date();

            if (raw.profile.program_start_date) {
                // Determine week 1 from the program start date
                const start = new Date(raw.profile.program_start_date);
                start.setHours(0, 0, 0, 0);
                ANCHOR_DATE = start;
                // If we also want it to display the whole past year since that start, we minus weeks:
                // ANCHOR_DATE.setDate(ANCHOR_DATE.getDate() - (51 * 7));
                // But typically for tracking progress we track *from* that date forward.
            } else if (raw.volumeData.length > 0) {
                // Fallback 1: Earliest log
                const earliestLog = raw.volumeData[0];
                ANCHOR_DATE = new Date(earliestLog.date);
                ANCHOR_DATE.setHours(0, 0, 0, 0);
            } else {
                // Fallback 2: Today
                ANCHOR_DATE = new Date();
                ANCHOR_DATE.setHours(0, 0, 0, 0);
            }

            // Intermediate Maps
            const tonnageMap: Record<number, number> = {};
            const efficiencyMap: Record<number, number> = {};
            const intensityMap: Record<number, { sum: number, count: number }> = {};
            const stressMap: Record<number, number> = {};
            const recMap: Record<number, { sum: number, count: number }> = {};
            const prMap: Record<string, number> = {};
            const distMap: Record<number, number> = {};
            const durationMap: Record<number, number> = {};
            const powerMap: Record<number, { sum: number, count: number }> = {};
            const runningMaxes: Record<string, number> = {};
            const historicalPRs: HistoricalPR[] = [];

            // New real-data maps (phase-specific)
            const squatMap: Record<number, { sum: number, count: number }> = {};
            const benchMap: Record<number, { sum: number, count: number }> = {};
            const zone2HrMap: Record<number, { sum: number, count: number }> = {};
            const zone2DistMap: Record<number, number> = {};
            const metconHrMap: Record<number, { sum: number, count: number }> = {};
            const singlesSquatMap: Record<number, number> = {};
            const singlesDeadliftMap: Record<number, number> = {};
            const zone1HrMap: Record<number, { sum: number, count: number }> = {};
            const cardioMinMap: Record<number, number> = {};
            const sessionCountMap: Record<number, number> = {};
            const arcSquatMap: Record<number, number> = {};
            const arcBenchMap: Record<number, number> = {};
            const SQUAT_NAMES = ['back squat', 'low bar back squat', 'squat singles', 'back squat (low bar)'];
            const BENCH_NAMES = ['bench press', 'bench singles'];
            const DEADLIFT_SINGLE_NAMES = ['deadlift singles'];
            const ZONE1_NAMES = ['easy run', 'easy row', 'easy spin', 'zone 1 walk', 'zone 1 activity', 'continuous multi-modal'];
            const ZONE2_NAMES = ['zone 2 run', 'zone 2'];
            const ONE_RM_NAMES = ['snatch 1rm', 'clean & jerk 1rm', 'deadlift 1rm', 'front squat 1rm', 'back squat 1rm', 'bench press 1rm', 'ohp 1rm'];


            // 1. Seed historicalPRs with Profile Baselines (Weight)
            const weightBaselines: Record<string, number | undefined> = {
                "Back Squat": raw.profile.squat_max,
                "Front Squat": raw.profile.front_squat_max,
                "Bench Press": raw.profile.bench_max,
                "Deadlift": raw.profile.deadlift_max,
                "Overhead Press": raw.profile.ohp_max,
                "Clean & Jerk": raw.profile.clean_jerk_max,
                "Snatch": raw.profile.snatch_max
            };
            Object.entries(weightBaselines).forEach(([name, val]) => {
                if (val && val > 0) {
                    runningMaxes[name] = val;
                    historicalPRs.push({
                        id: `baseline-${name}`,
                        exercise_name: name,
                        value: val,
                        unit: 'lbs',
                        pr_type: 'Weight',
                        created_at: ANCHOR_DATE.toISOString()
                    });
                }
            });

            // 2. Seed historicalPRs with Profile Baselines (Cardio Time/Pace)
            const cardioBaselines: Record<string, { val: number | undefined, type: string, unit: string }> = {
                "1 Mile": { val: raw.profile.mile_time_sec, type: 'Time', unit: 'sec' },
                "5k": { val: raw.profile.k5_time_sec, type: 'Time', unit: 'sec' },
                "400m": { val: raw.profile.sprint_400m_sec, type: 'Time', unit: 'sec' },
                "2k Row": { val: raw.profile.row_2k_sec, type: 'Time', unit: 'sec' },
                "500m Row": { val: raw.profile.row_500m_sec, type: 'Time', unit: 'sec' },
                "1k Ski": { val: raw.profile.ski_1k_sec, type: 'Time', unit: 'sec' },
                "Max Bike Watts": { val: raw.profile.bike_max_watts, type: 'Pwr', unit: 'watts' },
                "Zone 2 Pace": { val: raw.profile.zone2_pace_per_mile_sec, type: 'Pace', unit: 'sec' },
                "Tempo Pace": { val: raw.profile.tempo_pace_per_mile_sec, type: 'Pace', unit: 'sec' }
            };
            Object.entries(cardioBaselines).forEach(([name, config]) => {
                if (config.val && config.val > 0) {
                    runningMaxes[name] = config.val;
                    historicalPRs.push({
                        id: `baseline-${name}`,
                        exercise_name: name,
                        value: config.val,
                        unit: config.unit,
                        pr_type: config.type,
                        created_at: ANCHOR_DATE.toISOString()
                    });
                }
            });

            // Heatmap arrays (56 days = 8 weeks of structural phase)
            const activeDays = new Array(56).fill(false);
            const readyDays = new Array(56).fill(70);

            // 1. Process Logs for Tonnage, Intensity, Efficiency, Stress
            raw.volumeData.forEach((log: AnalyticsLog) => {
                const weekIdx = log.week_number - 1;

                if (weekIdx >= 0 && weekIdx < TOTAL_WEEKS) {
                    // Heatmap (Phase 1 focus - days 1-56)
                    const dateParts = log.date.split('-');
                    const d = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
                    const diffDays = Math.floor(Math.abs(d.getTime() - ANCHOR_DATE.getTime()) / (24 * 60 * 60 * 1000));
                    if (diffDays >= 0 && diffDays < 56) {
                        activeDays[diffDays] = true;
                    }

                    if (log.performance_data) {
                        const perf = log.performance_data;
                        let vol = 0;
                        let avgWeight = 0;

                        if (perf.sets && Array.isArray(perf.sets)) {
                            vol = perf.sets.reduce((acc: number, s: AnalyticsSet) => acc + ((s.weight || 0) * (s.reps || 0)), 0);
                            avgWeight = perf.sets.reduce((acc: number, s: AnalyticsSet) => acc + (s.weight || 0), 0) / perf.sets.length;
                        } else if (perf.weight && perf.reps) {
                            vol = Number(perf.weight) * Number(perf.reps);
                            avgWeight = Number(perf.weight);
                        }

                        if (vol > 0) {
                            tonnageMap[weekIdx] = (tonnageMap[weekIdx] || 0) + vol;

                            // CNS Intensity (%1RM Calculation)
                            const baselineName = mapExerciseToBaseline(log.segment_name);
                            // Map baseline name to profile key
                            let profileKey: keyof typeof raw.profile | null = null;
                            if (baselineName === "Back Squat") profileKey = "squat_max";
                            else if (baselineName === "Bench Press") profileKey = "bench_max";
                            else if (baselineName === "Deadlift") profileKey = "deadlift_max";
                            else if (baselineName === "Overhead Press") profileKey = "ohp_max";
                            else if (baselineName.toLowerCase().includes("clean")) profileKey = "clean_jerk_max";
                            else if (baselineName.toLowerCase().includes("snatch")) profileKey = "snatch_max";

                            const baseMax = profileKey ? (raw.profile[profileKey] as number) || 0 : 0;

                            if (baseMax > 0 && avgWeight > 0) {
                                const relInt = (avgWeight / baseMax) * 100;
                                if (!intensityMap[weekIdx]) intensityMap[weekIdx] = { sum: 0, count: 0 };
                                intensityMap[weekIdx].sum += relInt;
                                intensityMap[weekIdx].count++;

                                // System Stress (Simplified TSS)
                                const tss = (vol * (relInt / 100)) / 100;
                                stressMap[weekIdx] = (stressMap[weekIdx] || 0) + tss;

                                // Power Density (Vol * Rel Intensity / Time)
                                if (perf.duration_min) {
                                    const dur = parseFloat(perf.duration_min) || 30;
                                    const pwr = (vol * (relInt / 100)) / dur;
                                    if (!powerMap[weekIdx]) powerMap[weekIdx] = { sum: 0, count: 0 };
                                    powerMap[weekIdx].sum += pwr;
                                    powerMap[weekIdx].count++;
                                }

                                // Historical PR Detection (Weight) - ONLY Main Lifts in Profile
                                const baselineMapping = mapExerciseToBaseline(log.segment_name);
                                const isMainLift = baselineMapping !== "Other";

                                if (isMainLift && avgWeight > (runningMaxes[baselineMapping] || 0)) {
                                    runningMaxes[baselineMapping] = avgWeight;
                                    historicalPRs.push({
                                        id: `${log.date}-${baselineMapping}`,
                                        exercise_name: baselineMapping,
                                        value: avgWeight,
                                        unit: 'lbs',
                                        pr_type: 'Weight',
                                        created_at: log.date
                                    });
                                }
                            }
                        }

                        // Aerobic Efficiency & Cardio Volume
                        if (perf.distance || perf.duration_min) {
                            const dist = parseFloat(perf.distance || "0");
                            const dur = parseFloat(perf.duration_min || "0");

                            if (dist > 0) {
                                distMap[weekIdx] = (distMap[weekIdx] || 0) + dist;

                                // Historical PR Detection (Cardio) - Time & Pace
                                const baselineName = mapExerciseToBaseline(log.segment_name);
                                const cardioKeywords = ["Run", "Cycle", "Row", "Swim", "Ski"];
                                const isMainCardio = cardioKeywords.some(kw => log.segment_name.includes(kw) || baselineName.includes(kw));

                                if (isMainCardio && dur > 0 && dist > 0) {
                                    const isBenchmark = ["1 Mile", "5k", "400m", "2k Row", "500m Row", "1k Ski", "Max Bike Watts", "Zone 2 Pace", "Tempo Pace"].includes(baselineName);
                                    const totalSec = dur * 60;
                                    const avgWatts = parseFloat(perf.avg_watts || "0");

                                    if (isBenchmark) {
                                        // Track Fastest Time or Power PR
                                        const profileBenchMapping: Record<string, number | undefined> = {
                                            "1 Mile": raw.profile.mile_time_sec,
                                            "5k": raw.profile.k5_time_sec,
                                            "400m": raw.profile.sprint_400m_sec,
                                            "2k Row": raw.profile.row_2k_sec,
                                            "500m Row": raw.profile.row_500m_sec,
                                            "1k Ski": raw.profile.ski_1k_sec,
                                            "Max Bike Watts": raw.profile.bike_max_watts,
                                            "Zone 2 Pace": raw.profile.zone2_pace_per_mile_sec,
                                            "Tempo Pace": raw.profile.tempo_pace_per_mile_sec
                                        };
                                        const currentBest = runningMaxes[baselineName] || profileBenchMapping[baselineName] || (baselineName === "Max Bike Watts" ? 0 : Infinity);

                                        const isImprovement = baselineName === "Max Bike Watts" ? (avgWatts > currentBest) : (totalSec < currentBest);
                                        const newValue = baselineName === "Max Bike Watts" ? avgWatts : totalSec;

                                        if (isImprovement && newValue > 0) {
                                            runningMaxes[baselineName] = newValue;
                                            historicalPRs.push({
                                                id: `${log.date}-${baselineName}`,
                                                exercise_name: baselineName,
                                                value: newValue,
                                                unit: baselineName === "Max Bike Watts" ? 'watts' : 'sec',
                                                pr_type: baselineName === "Max Bike Watts" ? 'Pwr' : (baselineName.includes("Pace") ? 'Pace' : 'Time'),
                                                created_at: log.date
                                            });
                                        }
                                    } else {
                                        // Track Best Pace PR (sec per unit distance)
                                        const pace = totalSec / dist;
                                        const paceKey = `${baselineName}-pace`;
                                        const currentBestPace = runningMaxes[paceKey] || Infinity;

                                        if (pace < currentBestPace) {
                                            runningMaxes[paceKey] = pace;
                                            historicalPRs.push({
                                                id: `${log.date}-${paceKey}`,
                                                exercise_name: `${baselineName} Pace`,
                                                value: pace,
                                                unit: 'sec',
                                                pr_type: 'Pace',
                                                created_at: log.date
                                            });
                                        }
                                    }
                                }
                                if (dur > 0) durationMap[weekIdx] = (durationMap[weekIdx] || 0) + dur;

                                if (perf.avg_hr && dist > 0 && dur > 0) {
                                    const mph = dist / (dur / 60);
                                    if (mph > 0) {
                                        const efficiency = (mph / perf.avg_hr) * 1000;
                                        efficiencyMap[weekIdx] = efficiency;
                                    }
                                }
                            }
                        }

                        // ── New real-data processing ──────────────────────────────────────
                        const segLower = log.segment_name?.toLowerCase() || '';

                        // Track session count per week
                        sessionCountMap[weekIdx] = (sessionCountMap[weekIdx] || 0) + 1;

                        if (log.performance_data) {
                            const perf = log.performance_data;
                            const setsArr = perf.sets && Array.isArray(perf.sets) ? perf.sets : [];

                            // Strength: avg working weight per main lift
                            if (setsArr.length > 0) {
                                const avgW = setsArr.reduce((s: number, x: AnalyticsSet) => s + (x.weight || 0), 0) / setsArr.length;
                                const maxW = Math.max(...setsArr.map((x: AnalyticsSet) => x.weight || 0));

                                if (SQUAT_NAMES.some(n => segLower.includes(n))) {
                                    if (!squatMap[weekIdx]) squatMap[weekIdx] = { sum: 0, count: 0 };
                                    squatMap[weekIdx].sum += avgW;
                                    squatMap[weekIdx].count++;
                                    // 52-week arc: peak squat weight per week
                                    arcSquatMap[weekIdx] = Math.max(arcSquatMap[weekIdx] || 0, maxW);
                                    // Singles peak
                                    if (segLower.includes('singles')) {
                                        singlesSquatMap[weekIdx] = Math.max(singlesSquatMap[weekIdx] || 0, maxW);
                                    }
                                }
                                if (BENCH_NAMES.some(n => segLower.includes(n))) {
                                    if (!benchMap[weekIdx]) benchMap[weekIdx] = { sum: 0, count: 0 };
                                    benchMap[weekIdx].sum += avgW;
                                    benchMap[weekIdx].count++;
                                    arcBenchMap[weekIdx] = Math.max(arcBenchMap[weekIdx] || 0, maxW);
                                }
                                if (DEADLIFT_SINGLE_NAMES.some(n => segLower.includes(n))) {
                                    singlesDeadliftMap[weekIdx] = Math.max(singlesDeadliftMap[weekIdx] || 0, maxW);
                                }
                            }

                            // Cardio: Zone 2 HR + distance
                            const dur = parseFloat(String(perf.duration_min || 0));
                            const dist = parseFloat(String(perf.distance || 0));
                            const avgHr = perf.avg_hr ? Number(perf.avg_hr) : 0;

                            if (ZONE2_NAMES.some(n => segLower.includes(n))) {
                                if (avgHr > 0) {
                                    if (!zone2HrMap[weekIdx]) zone2HrMap[weekIdx] = { sum: 0, count: 0 };
                                    zone2HrMap[weekIdx].sum += avgHr;
                                    zone2HrMap[weekIdx].count++;
                                }
                                if (dist > 0) zone2DistMap[weekIdx] = (zone2DistMap[weekIdx] || 0) + dist;
                            }

                            // Zone 1 easy cardio HR (Phase 4 taper monitor)
                            if (ZONE1_NAMES.some(n => segLower.includes(n))) {
                                if (avgHr > 0) {
                                    if (!zone1HrMap[weekIdx]) zone1HrMap[weekIdx] = { sum: 0, count: 0 };
                                    zone1HrMap[weekIdx].sum += avgHr;
                                    zone1HrMap[weekIdx].count++;
                                }
                            }

                            // MetCon HR (Phase 2)
                            if (log.tracking_mode === 'METCON' && avgHr > 0) {
                                if (!metconHrMap[weekIdx]) metconHrMap[weekIdx] = { sum: 0, count: 0 };
                                metconHrMap[weekIdx].sum += avgHr;
                                metconHrMap[weekIdx].count++;
                            }

                            // Weekly cardio minutes (Phase 4 taper compliance)
                            if ((log.tracking_mode === 'CARDIO_BASIC' || log.tracking_mode === 'METCON') && dur > 0) {
                                cardioMinMap[weekIdx] = (cardioMinMap[weekIdx] || 0) + dur;
                            }
                        }
                        // ── End new processing ────────────────────────────────────────────
                    }
                }
            });

            // 2. Process Sleep & Readiness for Recovery Index using ANCHOR_DATE
            raw.sleepData.forEach((s: SleepMetric) => {
                const dateParts = s.date.split('-');
                const d = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
                const diffTime = d.getTime() - ANCHOR_DATE.getTime();
                const weekIdx = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));

                if (weekIdx >= 0 && weekIdx < TOTAL_WEEKS) {
                    if (!recMap[weekIdx]) recMap[weekIdx] = { sum: 0, count: 0 };
                    const optimalSleep = 480;
                    const sleepDiff = Math.abs(s.asleep_minutes - optimalSleep);
                    const sleepScore = Math.max(20, 100 - (sleepDiff / 4.8));
                    recMap[weekIdx].sum += sleepScore;
                    recMap[weekIdx].count++;
                }
            });

            raw.readinessData.forEach((r: ReadinessMetric) => {
                const dateParts = r.date.split('-');
                const d = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
                const diffTime = d.getTime() - ANCHOR_DATE.getTime();
                const dayOffset = Math.floor(diffTime / (24 * 60 * 60 * 1000));

                if (dayOffset >= 0 && dayOffset < 56) {
                    readyDays[dayOffset] = r.readiness_score || 70;
                }
            });

            // Format Arrays
            const weeklyTonnage = Array.from({ length: TOTAL_WEEKS }, (_, i) => tonnageMap[i] || 0);
            const efficiencyIndex = Array.from({ length: TOTAL_WEEKS }, (_, i) => efficiencyMap[i] || 0);
            const systemStress = Array.from({ length: TOTAL_WEEKS }, (_, i) => stressMap[i] || 0);
            const recoveryIndex = Array.from({ length: TOTAL_WEEKS }, (_, i) => {
                if (recMap[i] && recMap[i].count > 0) {
                    return Math.min(100, Math.max(0, recMap[i].sum / recMap[i].count));
                }
                return 0;
            });
            const cnsIntensity = Array.from({ length: TOTAL_WEEKS }, (_, i) => {
                if (intensityMap[i] && intensityMap[i].count > 0) {
                    return Math.min(100, intensityMap[i].sum / intensityMap[i].count);
                }
                return 0;
            });

            // Gap filling and smoothing
            for (let i = 1; i < TOTAL_WEEKS; i++) {
                if (efficiencyIndex[i] === 0) efficiencyIndex[i] = efficiencyIndex[i - 1] || 60;
                if (cnsIntensity[i] === 0) cnsIntensity[i] = cnsIntensity[i - 1] || 75;
                if (recoveryIndex[i] === 0) recoveryIndex[i] = recoveryIndex[i - 1] || 80;
            }

            const powerDensity = Array.from({ length: TOTAL_WEEKS }, (_, i) =>
                (powerMap[i] && powerMap[i].count > 0) ? (powerMap[i].sum / powerMap[i].count) : 0
            );
            const readinessSurplus = Array.from({ length: TOTAL_WEEKS }, (_, i) =>
                Math.max(-50, Math.min(50, (recoveryIndex[i] || 70) - (Math.min(100, systemStress[i] / 2) || 40)))
            );
            const prMagnitude = Array.from({ length: TOTAL_WEEKS }, (_, i) => {
                const count = historicalPRs.filter(p => {
                    const d = new Date(p.created_at);
                    const diffTime = d.getTime() - ANCHOR_DATE.getTime();
                    const w = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
                    return w === i;
                }).length;
                return count * 10; // Scale for chart visibility
            });

            for (let i = 1; i < TOTAL_WEEKS; i++) {
                if (powerDensity[i] === 0) powerDensity[i] = powerDensity[i - 1] || 25;
            }

            // Derive final new arrays from new maps
            const squatWeeklyAvg = Array.from({ length: TOTAL_WEEKS }, (_, i) =>
                squatMap[i]?.count > 0 ? squatMap[i].sum / squatMap[i].count : 0
            );
            const benchWeeklyAvg = Array.from({ length: TOTAL_WEEKS }, (_, i) =>
                benchMap[i]?.count > 0 ? benchMap[i].sum / benchMap[i].count : 0
            );
            const zone2HrWeekly = Array.from({ length: TOTAL_WEEKS }, (_, i) =>
                zone2HrMap[i]?.count > 0 ? zone2HrMap[i].sum / zone2HrMap[i].count : 0
            );
            const zone2DistWeekly = Array.from({ length: TOTAL_WEEKS }, (_, i) => zone2DistMap[i] || 0);
            const metconHrWeekly = Array.from({ length: TOTAL_WEEKS }, (_, i) =>
                metconHrMap[i]?.count > 0 ? metconHrMap[i].sum / metconHrMap[i].count : 0
            );
            const singlesSquatPeak = Array.from({ length: TOTAL_WEEKS }, (_, i) => singlesSquatMap[i] || 0);
            const singlesDeadliftPeak = Array.from({ length: TOTAL_WEEKS }, (_, i) => singlesDeadliftMap[i] || 0);
            const zone1HrWeekly = Array.from({ length: TOTAL_WEEKS }, (_, i) =>
                zone1HrMap[i]?.count > 0 ? zone1HrMap[i].sum / zone1HrMap[i].count : 0
            );
            const weeklyCardioMin = Array.from({ length: TOTAL_WEEKS }, (_, i) => cardioMinMap[i] || 0);
            const weeklySessionCount = Array.from({ length: TOTAL_WEEKS }, (_, i) => sessionCountMap[i] || 0);
            const fullArcSquatPeak = Array.from({ length: TOTAL_WEEKS }, (_, i) => arcSquatMap[i] || 0);
            const fullArcBenchPeak = Array.from({ length: TOTAL_WEEKS }, (_, i) => arcBenchMap[i] || 0);

            // Season totals
            const totalCardioDist = zone2DistWeekly.reduce((a, b) => a + b, 0) +
                Array.from({ length: TOTAL_WEEKS }, (_, i) => distMap[i] || 0).reduce((a, b) => a + b, 0);
            const totalPRsSet = raw.prHistoryData?.length || 0;

            // 1RM scoreboard: logs where segment name contains '1RM'
            const profileBaselineMap: Record<string, number | undefined> = {
                'snatch 1rm': raw.profile.snatch_max,
                'clean & jerk 1rm': raw.profile.clean_jerk_max,
                'deadlift 1rm': raw.profile.deadlift_max,
                'front squat 1rm': raw.profile.front_squat_max,
                'squat 1rm': raw.profile.squat_max,
                'bench 1rm': raw.profile.bench_max,
                'ohp 1rm': raw.profile.ohp_max,
            };
            const oneRMBestMap: Record<string, number> = {};
            raw.volumeData.forEach((log: AnalyticsLog) => {
                const sn = log.segment_name?.toLowerCase() || '';
                if (ONE_RM_NAMES.some(n => sn === n) && log.performance_data?.sets) {
                    const best = Math.max(...(log.performance_data.sets as AnalyticsSet[]).map((s: AnalyticsSet) => s.weight || 0));
                    if (best > 0) oneRMBestMap[sn] = Math.max(oneRMBestMap[sn] || 0, best);
                }
            });
            const oneRMResults = ONE_RM_NAMES
                .filter(n => oneRMBestMap[n])
                .map(n => {
                    const baseline = profileBaselineMap[n];
                    const value = oneRMBestMap[n];
                    const pctVsBaseline = baseline && baseline > 0 ? Math.round(((value - baseline) / baseline) * 100) : null;
                    const label = n.replace(/(^\w|\s\w)/g, m => m.toUpperCase());
                    return { name: label, value, unit: 'lbs', pctVsBaseline };
                });

            setData({
                rawLogs: raw.volumeData,
                rawSleepData: raw.sleepData,
                weeklyTonnage,
                efficiencyIndex,
                recoveryIndex,
                systemStress,
                cnsIntensity,
                prs: prMap,
                currentPhase: raw.profile.currentPhase,
                currentWeek: profileWeek,
                readinessHistory: raw.readinessData.map(r => r.readiness_score || 0),
                activityHeatmap: activeDays,
                readinessHeatmap: readyDays,
                weeklyCardioDist: Array.from({ length: TOTAL_WEEKS }, (_, i) => distMap[i] || 0),
                aerobicVolume: Array.from({ length: TOTAL_WEEKS }, (_, i) => durationMap[i] || 0),
                powerDensity,
                readinessSurplus,
                prMagnitude,
                historicalPRs: historicalPRs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
                runningMaxes,
                squatWeeklyAvg,
                benchWeeklyAvg,
                zone2HrWeekly,
                zone2DistWeekly,
                metconHrWeekly,
                singlesSquatPeak,
                singlesDeadliftPeak,
                zone1HrWeekly,
                weeklyCardioMin,
                weeklySessionCount,
                fullArcSquatPeak,
                fullArcBenchPeak,
                totalCardioDist,
                totalPRsSet,
                oneRMResults,
                profileMaxes: {
                    squat_max: raw.profile.squat_max,
                    bench_max: raw.profile.bench_max,
                    deadlift_max: raw.profile.deadlift_max,
                    ohp_max: raw.profile.ohp_max,
                    clean_jerk_max: raw.profile.clean_jerk_max,
                    snatch_max: raw.profile.snatch_max,
                    mile_time_sec: raw.profile.mile_time_sec,
                    k5_time_sec: raw.profile.k5_time_sec,
                    sprint_400m_sec: raw.profile.sprint_400m_sec,
                    row_2k_sec: raw.profile.row_2k_sec,
                    row_500m_sec: raw.profile.row_500m_sec,
                    ski_1k_sec: raw.profile.ski_1k_sec,
                    bike_max_watts: raw.profile.bike_max_watts,
                    zone2_pace_per_mile_sec: raw.profile.zone2_pace_per_mile_sec,
                    tempo_pace_per_mile_sec: raw.profile.tempo_pace_per_mile_sec,
                    zone2_row_pace_500m_sec: raw.profile.zone2_row_pace_500m_sec,
                }
            });

        };
        fetchData();
    }, []);

    if (!data) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground font-serif italic text-xl tracking-tight animate-pulse">Synchronizing Neural Performance Data...</p>
        </div>
    );

    const isPhase1 = data.currentPhase === 1;
    const isPhase2 = data.currentPhase === 2;
    const isPhase3 = data.currentPhase === 3;
    const isPhase4 = data.currentPhase === 4;
    const isPhase5 = data.currentPhase === 5;

    return (
        <div className="max-w-7xl mx-auto space-y-24 pt-32 pb-48 px-4">
            {/* STAGE 1: MISSION CONTROL BRIEFING */}
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-16 border-b border-border pb-20 pt-12">
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-3 w-3 rounded-full bg-primary animate-ping" />
                        <span className="text-primary font-bold tracking-[0.5em] text-[10px] uppercase">Telemetry Active // Phase {data.currentPhase}</span>
                    </div>
                    <div>
                        <h1 className="font-serif text-[10vw] lg:text-9xl text-foreground leading-none tracking-tighter">
                            In-Sight<span className="text-primary">.</span>
                        </h1>
                        <p className="text-muted-foreground mt-6 max-w-md font-light text-lg leading-relaxed italic">
                            Measuring adaptation, not just effort. Visualizing the physiological shift across the {data.currentWeek}-week trajectory.
                        </p>
                    </div>
                </div>

                {/* Intelligence Tile */}
                <div className="bg-card text-foreground border border-border rounded-[48px] p-10 lg:w-1/3 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-12 -top-12 opacity-5 rotate-12 group-hover:opacity-10 transition-all duration-700">
                        <Activity size={240} strokeWidth={0.5} />
                    </div>
                    <div className="relative z-10 space-y-10">
                        <div className="flex justify-between items-center text-[10px] font-bold tracking-[0.3em] uppercase">
                            <span className="text-primary">Intelligence Brief</span>
                            <span className="text-muted-foreground">Cycle {Math.ceil(data.currentWeek / 4)}</span>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-3xl font-serif italic text-foreground">
                                {isPhase1 && "Structural Load Optimized"}
                                {isPhase2 && "CNS Intensity Sustained"}
                                {isPhase3 && "Peak Power Surfacing"}
                                {isPhase4 && "Super-Compensation Window"}
                                {isPhase5 && "Absolute Performance Ceiling"}
                            </h3>
                            <p className="text-muted-foreground text-sm font-light leading-relaxed">
                                {isPhase1 && (() => {
                                    const totalTon = Math.round(data.weeklyTonnage.slice(0, data.currentWeek).reduce((a, b) => a + b, 0) / 1000);
                                    const z2Hrs = data.zone2HrWeekly.filter(v => v > 0);
                                    const avgZ2 = z2Hrs.length > 0 ? Math.round(z2Hrs.reduce((a, b) => a + b, 0) / z2Hrs.length) : null;
                                    return `${totalTon}k lbs of structural tonnage logged. ${avgZ2 ? `Zone 2 avg HR: ${avgZ2} bpm — if trending down, your aerobic engine is adapting.` : 'Log Zone 2 runs to track aerobic adaptation.'}`;
                                })()}
                                {isPhase2 && (() => {
                                    const avgInt = Math.round(data.cnsIntensity.slice(8, data.currentWeek).reduce((a, b) => a + b, 0) / (data.currentWeek - 8 || 1));
                                    return `Lifting at ${avgInt}% of 1RM average. CNS load tolerance is stabilizing across strength blocks.`;
                                })()}
                                {isPhase3 && (() => {
                                    const nonZero = data.powerDensity.filter(v => v > 0);
                                    const peak = nonZero.length > 0 ? Math.round(Math.max(...nonZero)) : 0;
                                    return `Peak power density reached ${peak} units. Reduce volume and protect intensity windows as you approach the final phase.`;
                                })()}
                                {isPhase4 && (() => {
                                    const wk = data.currentWeek - 1;
                                    const peakSingle = Math.max(data.singlesSquatPeak[wk] || 0, data.singlesDeadliftPeak[wk] || 0);
                                    const sessions = data.weeklySessionCount[wk] || 0;
                                    return `${peakSingle > 0 ? `${peakSingle} lbs peak single this week.` : 'Singles not yet logged this week.'} ${sessions} sessions logged — volume tapering as CNS primes for peak output.`;
                                })()}
                                {isPhase5 && (() => {
                                    const totalTon = Math.round(data.weeklyTonnage.reduce((a, b) => a + b, 0) / 1000);
                                    const prCount = data.totalPRsSet;
                                    return `${totalTon}k lbs total season tonnage. ${prCount > 0 ? `${prCount} PRs recorded.` : 'No PRs logged yet — 1RM test days show here.'} Full 52-week arc plotted below.`;
                                })()}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-8 border-t border-border pt-8">
                            {(() => {
                                const wk = data.currentWeek - 1;
                                const statPairs: { label: string; value: string | number }[] = isPhase1 ? [
                                    { label: "Total Tonnage", value: `${Math.round(data.weeklyTonnage.reduce((a, b) => a + b, 0) / 1000)}k` },
                                    { label: "Zone 2 Avg HR", value: (() => { const v = data.zone2HrWeekly.filter(x => x > 0); return v.length > 0 ? `${Math.round(v.reduce((a, b) => a + b, 0) / v.length)} bpm` : '—'; })() }
                                ] : isPhase2 ? [
                                    { label: "Avg Intensity", value: `${Math.round(data.cnsIntensity.slice(0, data.currentWeek).filter(v => v > 0).reduce((a, b, _, arr) => a + b / arr.length, 0))}%` },
                                    { label: "MetCon Avg HR", value: (() => { const v = data.metconHrWeekly.filter(x => x > 0); return v.length > 0 ? `${Math.round(v.reduce((a, b) => a + b, 0) / v.length)} bpm` : '—'; })() }
                                ] : isPhase3 ? [
                                    { label: "Peak Power", value: `${Math.round(Math.max(...data.powerDensity.filter(v => v > 0), 0))}` },
                                    { label: "Squat PR", value: data.runningMaxes['Back Squat'] ? `${data.runningMaxes['Back Squat']} lbs` : '—' }
                                ] : isPhase4 ? [
                                    { label: "Peak Single", value: (() => { const sq = Math.max(...data.singlesSquatPeak.filter(v => v > 0), 0); return sq > 0 ? `${sq} lbs` : '—'; })() },
                                    { label: "Sessions Wk", value: data.weeklySessionCount[wk] || 0 }
                                ] : [
                                    { label: "Season Tonnage", value: `${Math.round(data.weeklyTonnage.reduce((a, b) => a + b, 0) / 1000)}k` },
                                    { label: "PRs Set", value: data.totalPRsSet || 0 }
                                ];
                                return statPairs.map(stat => (
                                    <div key={stat.label}>
                                        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
                                        <p className="text-3xl font-serif text-foreground">{stat.value}</p>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </div>
            </header>

            {/* STAGE 2: PHASE-DYNAMIC INTELLIGENCE */}
            {
                data.rawLogs.length === 0 ? (
                    <section className="space-y-12">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                            <div className="space-y-2 opacity-50">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Dynamic Focus</span>
                                <h2 className="text-5xl font-serif text-muted-foreground tracking-tight">Signal Lost</h2>
                            </div>
                        </div>

                        <div className="bg-card/50 border border-border/50 border-dashed rounded-[48px] p-24 text-center space-y-8 flex flex-col items-center justify-center min-h-[400px]">
                            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center animate-pulse">
                                <Activity size={48} className="text-muted-foreground opacity-50" />
                            </div>
                            <div className="max-w-xl mx-auto space-y-4">
                                <h3 className="text-3xl font-serif text-foreground">Neural Engine Standby</h3>
                                <p className="text-muted-foreground font-light text-lg">
                                    The Pulse algorithm requires biometric performance data to initialize.
                                    Complete your first training session to calibrate the telemetry grid.
                                </p>
                            </div>
                            <a href="/workout" className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-bold uppercase tracking-widest text-xs hover:scale-105 transition-transform">
                                Initiate First Protocol
                            </a>
                        </div>
                    </section>
                ) : (
                    <>
                        <section className="space-y-12">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                                <div className="space-y-2">
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Dynamic Focus</span>
                                    <h2 className="text-5xl font-serif text-foreground tracking-tight">
                                        {isPhase1 && "Aerobic & Structural Engine"}
                                        {isPhase2 && "Neurological Load Tolerance"}
                                        {isPhase3 && "Absolute Peak Performance"}
                                        {isPhase4 && "Neural Sharpness (Taper)"}
                                        {isPhase5 && "Master Cycle Completion"}
                                    </h2>
                                </div>
                                <div className="flex items-center gap-3 bg-muted/50 px-6 py-3 rounded-full border border-border">
                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Phase-Specific Metrics Locked</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Primary Graph Container */}
                                <div className="lg:col-span-2 bg-card rounded-[48px] p-12 border border-border shadow-sm relative group overflow-visible">
                                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                                        <Zap size={100} />
                                    </div>
                                    <div className="relative z-10 h-full flex flex-col justify-between">
                                        <div className="mb-8">
                                            <h4 className="text-xl font-serif text-foreground">
                                                {isPhase1 && "Lift Load Progression"}
                                                {isPhase2 && "CNS Intensity Progression (%1RM)"}
                                                {isPhase3 && "Power Density Index (Work/Time)"}
                                                {isPhase4 && "Peak Single — Squat vs Deadlift"}
                                                {isPhase5 && "52-Week Strength Arc"}
                                            </h4>
                                            <p className="text-muted-foreground text-xs font-light italic mt-1">
                                                {isPhase1 && "Weekly avg working weight — Back Squat (red) vs Bench Press. Rising numbers = linear progression working."}
                                                {isPhase2 && "Tracking relative load tolerance as we transition into heavier strength blocks."}
                                                {isPhase3 && "Peak performance window: measuring the density of work capacity at maximum recursive intensity."}
                                                {isPhase4 && "Weekly max single. Rising numbers = fatigue cleared, CNS primed for the competition window."}
                                                {isPhase5 && "Peak working weight per week across the full macro-cycle. Red = squat, secondary = bench."}
                                            </p>
                                        </div>

                                        <div className="flex-grow min-h-[300px]">
                                            {isPhase1 && (
                                                <PremiumAreaChart
                                                    data={data.squatWeeklyAvg}
                                                    secondaryData={data.benchWeeklyAvg}
                                                    color="#ef4444"
                                                    secondaryColor="#78716c"
                                                    units=" lbs"
                                                    secondaryUnits=" lbs"
                                                    height={300}
                                                />
                                            )}
                                            {isPhase2 && (
                                                <PremiumAreaChart
                                                    data={data.cnsIntensity}
                                                    color="var(--foreground)"
                                                    units="%"
                                                    height={300}
                                                />
                                            )}
                                            {isPhase3 && (
                                                <PremiumAreaChart
                                                    data={data.powerDensity}
                                                    color="#fbbf24"
                                                    units=" Pwr"
                                                    height={300}
                                                />
                                            )}
                                            {isPhase4 && (
                                                <PremiumAreaChart
                                                    data={data.singlesSquatPeak}
                                                    secondaryData={data.singlesDeadliftPeak}
                                                    color="#ef4444"
                                                    secondaryColor="#78716c"
                                                    units=" lbs"
                                                    secondaryUnits=" lbs"
                                                    height={300}
                                                />
                                            )}
                                            {isPhase5 && (
                                                <PremiumAreaChart
                                                    data={data.fullArcSquatPeak}
                                                    secondaryData={data.fullArcBenchPeak}
                                                    color="var(--primary)"
                                                    secondaryColor="#78716c"
                                                    units=" lbs"
                                                    secondaryUnits=" lbs"
                                                    height={300}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Secondary Context Box */}
                                <div className="bg-card rounded-[48px] p-12 border border-border shadow-sm flex flex-col justify-between">
                                    <div>
                                        <div className="w-12 h-12 rounded-2xl bg-muted shadow-sm flex items-center justify-center text-primary mb-8 border border-border">
                                            {isPhase1 && <Shield size={24} />}
                                            {isPhase2 && <Flame size={24} />}
                                            {isPhase3 && <Target size={24} />}
                                        </div>
                                        <h4 className="text-2xl font-serif text-foreground mb-4">
                                            {isPhase1 && "Structural Integrity"}
                                            {isPhase2 && "Threshold Stability"}
                                            {isPhase3 && "PR Proximity"}
                                            {isPhase4 && "Taper Readiness"}
                                            {isPhase5 && "Mastery Check"}
                                        </h4>
                                        <p className="text-muted-foreground text-sm leading-relaxed font-light mb-10">
                                            {isPhase1 && "Consistency is the primary driver. Green markers represent high-readiness structural loading sessions."}
                                            {isPhase2 && "Cardiovascular stability during metabolic stress. Are you holding pace as the weight gets heavier?"}
                                            {isPhase3 && "Tracking the delta between your current capabilities and your 52-week peak objectives."}
                                            {isPhase4 && "Parasympathetic dominance is required. HRV stability should be surfacing as systemic stress drops."}
                                            {isPhase5 && "Relative strength evolution. Visualizing the absolute shift in neurological recruitment since Cycle 1."}
                                        </p>
                                    </div>

                                    <div className="mt-auto">
                                        {isPhase1 && (
                                            <StructuralHeatmap
                                                data={data.activityHeatmap}
                                                readiness={data.readinessHeatmap}
                                            />
                                        )}
                                        {isPhase2 && (
                                            <div className="space-y-6">
                                                {[
                                                    { label: "Lactic Stability", val: 92, unit: " pts" },
                                                    { label: "Pace Std Dev", val: -5.4, unit: "%" },
                                                    { label: "HR Decay Rate", val: "Optimal", status: "Active" }
                                                ].map(s => (
                                                    <div key={s.label} className="flex justify-between items-end border-b border-border pb-2">
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{s.label}</span>
                                                        <div className="text-right">
                                                            <span className="text-xl font-serif text-foreground">{s.val}{s.unit}</span>
                                                            {s.status && <span className="text-[8px] text-muted-foreground uppercase ml-2">{s.status}</span>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {isPhase3 && (
                                            <div className="space-y-6">
                                                <PRProximityChart
                                                    label="Squat Objective"
                                                    current={data.runningMaxes["Back Squat"] || 315}
                                                    target={data.profileMaxes.squat_max ? data.profileMaxes.squat_max * 1.1 : 405}
                                                />
                                                <PRProximityChart
                                                    label="Engine Capacity"
                                                    current={Math.max(...data.efficiencyIndex)}
                                                    target={Math.max(...data.efficiencyIndex) * 1.2 || 100}
                                                    units="pts"
                                                />
                                            </div>
                                        )}
                                        {isPhase4 && (
                                            <div className="space-y-4">
                                                {[{
                                                    label: "Peak Single (Wk)",
                                                    val: (() => { const sq = Math.max(...data.singlesSquatPeak.filter(v => v > 0), 0); const dl = Math.max(...data.singlesDeadliftPeak.filter(v => v > 0), 0); const best = Math.max(sq, dl); return best > 0 ? `${best} lbs` : '—'; })()
                                                }, {
                                                    label: "Weekly Cardio Min",
                                                    val: (() => { const wk = data.currentWeek - 1; return data.weeklyCardioMin[wk] > 0 ? `${Math.round(data.weeklyCardioMin[wk])} min` : '—'; })()
                                                }, {
                                                    label: "Sessions This Wk",
                                                    val: data.weeklySessionCount[data.currentWeek - 1] || 0
                                                }].map(s => (
                                                    <div key={s.label} className="flex justify-between items-end border-b border-border pb-2">
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{s.label}</span>
                                                        <span className="text-xl font-serif text-foreground">{s.val}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {isPhase5 && (
                                            <div className="space-y-3">
                                                {data.oneRMResults.length > 0 ? data.oneRMResults.map(r => (
                                                    <div key={r.name} className="flex justify-between items-end border-b border-border pb-2">
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{r.name}</span>
                                                        <div className="text-right">
                                                            <span className="text-xl font-serif text-foreground">{r.value} lbs</span>
                                                            {r.pctVsBaseline !== null && (
                                                                <span className={`text-[10px] ml-2 font-bold ${r.pctVsBaseline >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                                                                    {r.pctVsBaseline >= 0 ? '+' : ''}{r.pctVsBaseline}%
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <p className="text-muted-foreground text-sm font-light italic">1RM test day pending — results appear here when logged.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* STAGE 3: CARDIO TREND */}
                        <section className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                            <div className="lg:col-span-3 space-y-10">
                                <div className="flex items-end justify-between px-2">
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-bold text-sky-500 uppercase tracking-widest">Cardiovascular Signal</span>
                                        <h2 className="text-4xl font-serif text-foreground tracking-tight">
                                            {isPhase4 ? 'Zone 1 HR (Taper Monitor)' : isPhase5 ? 'Aerobic Baseline (Season)' : 'Zone 2 HR Trend'}
                                        </h2>
                                        <p className="text-muted-foreground text-xs font-light italic">
                                            {isPhase4 ? 'Falling HR at the same easy effort = fatigue clearing' :
                                                isPhase5 ? 'Zone 2 HR across the full season vs Phase 1 baseline' :
                                                    isPhase2 ? 'MetCon avg HR per week — should stay steady as intensity climbs' :
                                                        'Avg heart rate during Zone 2 runs. Falling HR = aerobic engine adapting.'}
                                        </p>
                                    </div>
                                    <div className="bg-card p-4 rounded-2xl border border-border flex gap-10 shadow-sm">
                                        <div>
                                            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                                                {isPhase4 ? 'Zone 1 Avg HR' : isPhase2 ? 'MetCon Avg HR' : 'Zone 2 Avg HR'}
                                            </p>
                                            <p className="text-xl font-serif text-sky-500">
                                                {(() => {
                                                    const src = isPhase4 ? data.zone1HrWeekly : isPhase2 ? data.metconHrWeekly : data.zone2HrWeekly;
                                                    const vals = src.filter(v => v > 0);
                                                    return vals.length > 0 ? `${Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)} bpm` : '—';
                                                })()}
                                            </p>
                                        </div>
                                        {(isPhase1 || isPhase5) && (
                                            <div>
                                                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Avg Distance</p>
                                                <p className="text-xl font-serif text-foreground">
                                                    {(() => { const vals = data.zone2DistWeekly.filter(v => v > 0); return vals.length > 0 ? `${(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)} mi` : '—'; })()}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-card rounded-[48px] p-12 border border-border shadow-sm overflow-visible">
                                    <PremiumAreaChart
                                        data={isPhase4 ? data.zone1HrWeekly : isPhase2 ? data.metconHrWeekly : data.zone2HrWeekly}
                                        secondaryData={(isPhase1 || isPhase5) ? data.zone2DistWeekly : undefined}
                                        color="#0ea5e9"
                                        secondaryColor="#78716c"
                                        units=" bpm"
                                        secondaryUnits=" mi"
                                        height={320}
                                    />
                                </div>


                            </div>

                            <aside className="lg:col-span-1 space-y-8 h-fit">
                                <div className="bg-card rounded-[48px] p-8 md:p-10 border border-border shadow-sm flex flex-col justify-between h-fit min-h-[450px]">
                                    <div className="space-y-6 md:space-y-8">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                                            <Moon size={24} />
                                        </div>
                                        <h3 className="text-3xl font-serif text-foreground leading-tight">Sleep Stability Archive</h3>
                                        <div className="space-y-4">
                                            {(() => {
                                                const recent = data.rawSleepData.slice(-14);
                                                const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

                                                const avgDeep = avg(recent.map(s => s.deep_sleep_minutes || 0).filter(v => v > 0));
                                                const avgHrv = avg(recent.map(s => s.hrv_ms || 0).filter(v => v > 0));
                                                const avgRhr = avg(recent.map(s => s.resting_hr || 0).filter(v => v > 0));

                                                const formatDur = (m: number) => `${Math.floor(m / 60)}h ${Math.round(m % 60)}m`;

                                                return [
                                                    {
                                                        label: "Deep Sleep Avg",
                                                        val: avgDeep > 0 ? formatDur(avgDeep) : "—",
                                                        status: avgDeep >= 60 ? "Optimal" : avgDeep >= 45 ? "Good" : "Low"
                                                    },
                                                    {
                                                        label: "HRV Baseline",
                                                        val: avgHrv > 0 ? `${Math.round(avgHrv)} ms` : "—",
                                                        status: avgHrv >= 50 ? "Athletic" : avgHrv >= 35 ? "Stable" : "Recovery"
                                                    },
                                                    {
                                                        label: "Resting Heart",
                                                        val: avgRhr > 0 ? `${Math.round(avgRhr)} bpm` : "—",
                                                        status: avgRhr < 55 ? "Athletic" : avgRhr < 65 ? "Normal" : "Elevated"
                                                    }
                                                ].map(item => (
                                                    <div key={item.label} className="group">
                                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1 group-hover:text-indigo-500 transition-colors">{item.label}</p>
                                                        <div className="flex justify-between items-end">
                                                            <span className="text-xl font-serif text-foreground">{item.val}</span>
                                                            <span className={`text-[8px] font-bold uppercase ${item.status === "Optimal" || item.status === "Athletic" ? "text-green-500" :
                                                                item.status === "Good" || item.status === "Stable" || item.status === "Normal" ? "text-amber-500" :
                                                                    "text-red-500"
                                                                }`}>{item.status}</span>
                                                        </div>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                    <div className="pt-12">
                                        <button
                                            onClick={() => setSleepModalOpen(true)}
                                            className="w-full py-5 rounded-[24px] bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-primary/90 transition-all duration-500 shadow-xl active:scale-95"
                                        >
                                            Analyze Sleep Depth
                                        </button>
                                    </div>
                                </div>
                            </aside>
                        </section>
                    </>
                )
            }

            {/* Sleep Analysis Modal */}
            <SleepAnalysisModal
                isOpen={sleepModalOpen}
                onClose={() => setSleepModalOpen(false)}
                sleepData={data.rawSleepData}
            />

            {/* STAGE 4: VOLUME & BENCHMARKS ARCHITECTURE */}
            <section className="space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                    <div className="space-y-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Background Architecture</span>
                        <h2 className="text-4xl font-serif text-foreground tracking-tight">Macro-Cycle Progression</h2>
                    </div>

                    <div className="flex bg-muted/30 p-1 rounded-full border border-border self-start md:self-auto">
                        <button
                            onClick={() => setViewMode('tonnage')}
                            className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'tonnage' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Tonnage
                        </button>
                        <button
                            onClick={() => setViewMode('cardio')}
                            className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'cardio' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Distance
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 bg-card rounded-[48px] p-12 md:p-16 border border-border shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-end mb-12">
                            <div className="flex gap-12">
                                <div>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                                        {viewMode === 'tonnage' ? 'Total Tonnage Arc' : 'Total Distance Arc'}
                                    </p>
                                    <p className="text-5xl font-serif text-foreground tracking-tighter">
                                        {viewMode === 'tonnage' ? (
                                            units === 'metric'
                                                ? (data.weeklyTonnage.reduce((a, b) => a + b, 0) / 1000 * 0.453592).toFixed(1)
                                                : (data.weeklyTonnage.reduce((a, b) => a + b, 0) / 1000).toFixed(1)
                                        ) : (
                                            units === 'metric'
                                                ? (data.weeklyCardioDist.reduce((a, b) => a + b, 0) * 1.60934).toFixed(1)
                                                : (data.weeklyCardioDist.reduce((a, b) => a + b, 0)).toFixed(1)
                                        )}
                                        <span className="text-lg">
                                            {viewMode === 'tonnage'
                                                ? (units === 'metric' ? 'k/kg' : 'k/lbs')
                                                : (units === 'metric' ? ' km' : ' mi')
                                            }
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                                        {viewMode === 'tonnage' ? 'Work Density' : 'Aerobic Volume'}
                                    </p>
                                    <p className="text-5xl font-serif text-muted-foreground italic tracking-tighter">
                                        {viewMode === 'tonnage' ? 'High' : `${Math.round(data.aerobicVolume.reduce((a, b) => a + b, 0) / 60)}h`}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <ProgressionBarChart
                            data={viewMode === 'tonnage'
                                ? (units === 'metric' ? data.weeklyTonnage.map(v => v * 0.453592) : data.weeklyTonnage)
                                : (units === 'metric' ? data.weeklyCardioDist.map(v => v * 1.60934) : data.weeklyCardioDist)
                            }
                            height={250}
                            color={viewMode === 'tonnage' ? "bg-primary" : "bg-sky-500"}
                            units={viewMode === 'tonnage' ? getUnitLabel(units, 'weight') : (units === 'metric' ? 'km' : 'mi')}
                        />
                    </div>

                    <div className="lg:col-span-1">
                        <PRHistory
                            prs={data.historicalPRs}
                            viewMode={viewMode}
                            onOpenSpectrum={(history: HistoricalPR[]) => {
                                setPrHistory(history);
                                setPrModalOpen(true);
                            }}
                        />
                    </div>
                </div>
            </section>

            {/* Analysis Modals */}
            <SleepAnalysisModal
                isOpen={sleepModalOpen}
                onClose={() => setSleepModalOpen(false)}
                sleepData={data.rawSleepData}
            />
            <PRAnalysisModal
                isOpen={prModalOpen}
                onClose={() => setPrModalOpen(false)}
                prs={prHistory}
            />
        </div >
    );
}
