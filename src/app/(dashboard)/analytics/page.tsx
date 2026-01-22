"use client";

import { useEffect, useState } from "react";
import { Activity, Moon, Zap, Target, Shield, Flame } from "lucide-react";
import { getAnalyticsData } from "./actions";
import {
    PremiumAreaChart,
    ProgressionBarChart,
    StructuralHeatmap,
    RecoveryIndexChart
} from "@/components/AnalyticsCharts";
import { PRAnalysisModal } from "@/components/PRAnalysisModal";
import { PRHistory } from "@/components/PRHistory";
import { SleepAnalysisModal } from "@/components/SleepAnalysisModal";
import { useSettings } from "@/context/SettingsContext";
import { getUnitLabel, mapExerciseToBaseline } from "@/lib/conversions";
import { DEMO_USER_ID } from "@/lib/userSettings";

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
    performance_data?: {
        sets?: AnalyticsSet[];
        avg_hr?: number;
        distance?: string;
        duration_min?: string;
        weight?: number;
        reps?: number;
        rpe?: number;
    };
    segment_name: string;
}

interface ReadinessMetric {
    date: string;
    readiness_score?: number;
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
    } | null>(null);

    const { units } = useSettings();

    const [sleepModalOpen, setSleepModalOpen] = useState(false);
    const [prModalOpen, setPrModalOpen] = useState(false);
    const [prHistory, setPrHistory] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const raw = await getAnalyticsData();
            if (!raw) return;

            const profileWeek = raw.profile.currentWeek;

            const TOTAL_WEEKS = 52;
            let ANCHOR_DATE = new Date();

            // 1. Calculate the true ANCHOR_DATE (Monday of Week 1)
            // We use the earliest log and its week_number to find where Week 1 Monday would be
            if (raw.volumeData.length > 0) {
                const earliestLog = raw.volumeData[0];
                const logDate = new Date(earliestLog.date);
                const logWeek = earliestLog.week_number || 1;

                // Align to Monday of the log's week
                const day = logDate.getDay();
                const diff = logDate.getDate() - (day === 0 ? 6 : day - 1);
                const weekMonday = new Date(logDate);
                weekMonday.setDate(diff);
                weekMonday.setHours(0, 0, 0, 0);

                // Subtract (week - 1) weeks to get to Week 1 Monday
                ANCHOR_DATE = new Date(weekMonday);
                ANCHOR_DATE.setDate(ANCHOR_DATE.getDate() - (logWeek - 1) * 7);
            } else {
                // Fallback: Monday of this week - 51 weeks
                const now = new Date();
                const day = now.getDay();
                const diff = now.getDate() - (day === 0 ? 6 : day - 1);
                ANCHOR_DATE = new Date(now);
                ANCHOR_DATE.setDate(diff - (51 * 7));
                ANCHOR_DATE.setHours(0, 0, 0, 0);
            }

            // Intermediate Maps
            const tonnageMap: Record<number, number> = {};
            const efficiencyMap: Record<number, number> = {};
            const intensityMap: Record<number, { sum: number, count: number }> = {};
            const stressMap: Record<number, number> = {};
            const recMap: Record<number, { sum: number, count: number }> = {};
            const prMap: Record<string, number> = {};

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
                            }
                        }

                        // Aerobic Efficiency
                        if (perf.avg_hr && perf.distance && perf.duration_min) {
                            const mph = parseFloat(perf.distance) / (parseFloat(perf.duration_min) / 60);
                            if (mph > 0) {
                                const efficiency = (mph / perf.avg_hr) * 1000;
                                efficiencyMap[weekIdx] = efficiency;
                            }
                        }
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
                readinessHeatmap: readyDays
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
                                    const firstEff = data.efficiencyIndex.find(e => e > 0) || 1;
                                    const lastEff = data.efficiencyIndex[data.currentWeek - 1] || firstEff;
                                    const delta = Math.round(((lastEff - firstEff) / firstEff) * 100);
                                    return `Aerobic efficiency has climbed ${delta}% since baseline. Recovery capacity is ${data.recoveryIndex[data.currentWeek - 1] > data.systemStress[data.currentWeek - 1] ? 'exceeding' : 'tracking'} stress accumulation.`;
                                })()}
                                {isPhase2 && (() => {
                                    const avgInt = Math.round(data.cnsIntensity.slice(8, data.currentWeek).reduce((a, b) => a + b, 0) / (data.currentWeek - 8 || 1));
                                    return `Lifting at ${avgInt}% of 1RM average. CNS load tolerance is stabilizing across strength blocks.`;
                                })()}
                                {isPhase3 && (() => {
                                    const avgReady = Math.round(data.readinessHistory.slice(-14).reduce((a, b) => a + b, 0) / 14);
                                    return `Intensity is peaking. Taper initiated. Readiness scores averaging ${avgReady} over last 14 days.`;
                                })()}
                                {isPhase4 && "Training volume reduced. Maintaining intensity to sharpen neural recruitment while shedding accumulated fatigue."}
                                {isPhase5 && "Macro-cycle complete. Comparing absolute performance peaks against structural baselines from Week 1."}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-8 border-t border-border pt-8">
                            {[
                                {
                                    label: "Adaptation Score",
                                    value: (() => {
                                        const recAvg = data.recoveryIndex.slice(0, data.currentWeek).reduce((a, b) => a + b, 0) / data.currentWeek;
                                        const stressAvg = data.systemStress.slice(0, data.currentWeek).reduce((a, b) => a + b, 0) / data.currentWeek;
                                        return Math.min(99, Math.round(80 + (recAvg / (stressAvg + 1)) * 2));
                                    })()
                                },
                                { label: "Ready State", value: data.readinessHistory[data.readinessHistory.length - 1] || 0 }
                            ].map(stat => (
                                <div key={stat.label}>
                                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
                                    <p className="text-3xl font-serif text-foreground">{stat.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* STAGE 2: PHASE-DYNAMIC INTELLIGENCE */}
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
                                    {isPhase1 && "Efficiency Curve (Speed/HR)"}
                                    {isPhase2 && "CNS Intensity Progression (%1RM)"}
                                    {isPhase3 && "Peak Load Intensity (%1RM)"}
                                </h4>
                                <p className="text-muted-foreground text-xs font-light italic mt-1">
                                    Measure of physiological adaptation vs output.
                                </p>
                            </div>

                            <div className="flex-grow min-h-[300px]">
                                {isPhase1 && (
                                    <PremiumAreaChart
                                        data={data.efficiencyIndex}
                                        color="#ef4444"
                                        units=" pts"
                                        height={300}
                                    />
                                )}
                                {(isPhase2 || isPhase3 || isPhase4 || isPhase5) && (
                                    <PremiumAreaChart
                                        data={data.cnsIntensity}
                                        color={isPhase3 || isPhase5 ? "var(--primary)" : "var(--foreground)"}
                                        units="%"
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
                                {isPhase2 && "Threshold Drift"}
                                {isPhase3 && "Peak Preparation"}
                                {isPhase4 && "Recovery Surplus"}
                                {isPhase5 && "Benchmark Calibration"}
                            </h4>
                            <p className="text-muted-foreground text-sm leading-relaxed font-light mb-10">
                                {isPhase1 && "Tracking structural loading. Green markers indicate adaptation-ready sessions."}
                                {isPhase2 && "Analysis of work capacity at lactic threshold. Average heart rate during 5k splits."}
                                {isPhase3 && "Building towards PR testing. Current focus: power output density and neural efficiency."}
                                {isPhase4 && "Recovery exceeds load. Biometrics should reflect high parasitic nervous system dominance."}
                                {isPhase5 && "Final verification of the 52-week curriculum. Absolute metrics finalized for the next cycle."}
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
                                        { label: "Lactic Drift", val: -4.2, unit: "%" },
                                        { label: "Split Stability", val: 88, unit: "pts" }
                                    ].map(s => (
                                        <div key={s.label} className="flex justify-between items-end border-b border-border pb-2">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{s.label}</span>
                                            <span className="text-xl font-serif text-foreground">{s.val}{s.unit}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {(isPhase3 || isPhase4 || isPhase5) && (
                                <div className="space-y-6">
                                    {[
                                        { label: "Power Density", val: "High", status: "Optimizing" },
                                        { label: "Neural Efficiency", val: "94%", status: "Stable" },
                                        { label: "PR Testing", val: isPhase5 ? "Live" : "Scheduled", status: isPhase5 ? "Active" : "Incoming" }
                                    ].map(s => (
                                        <div key={s.label} className="flex justify-between items-end border-b border-border pb-2">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{s.label}</span>
                                            <div className="text-right">
                                                <span className="text-xl font-serif text-foreground">{s.val}</span>
                                                <span className="text-[8px] text-muted-foreground uppercase ml-2">{s.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* STAGE 3: UNIVERSAL RECOVERY DEBT & STRESS */}
            <section className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                <div className="lg:col-span-3 space-y-10">
                    <div className="flex items-end justify-between px-2">
                        <div className="space-y-2">
                            <span className="text-[10px] font-bold text-sky-500 uppercase tracking-widest">Biological Stability</span>
                            <h2 className="text-4xl font-serif text-foreground tracking-tight">Recovery Debt Index</h2>
                            <p className="text-muted-foreground text-xs font-light italic">Universal Stress (Red) vs Recovery Status (Blue)</p>
                        </div>
                        <div className="bg-card p-4 rounded-2xl border border-border flex gap-10 shadow-sm">
                            <div>
                                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Stress (TSS avg)</p>
                                <p className="text-xl font-serif text-red-500">{Math.round(data.systemStress[data.systemStress.length - 1])}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Recov Stability</p>
                                <p className="text-xl font-serif text-sky-500">{Math.round(data.recoveryIndex.slice(-4).reduce((a, b) => a + b, 0) / 4)}%</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-card rounded-[48px] p-12 border border-border shadow-sm overflow-visible">
                        <RecoveryIndexChart
                            stress={data.systemStress}
                            recovery={data.recoveryIndex}
                            height={300}
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

            {/* Sleep Analysis Modal */}
            <SleepAnalysisModal
                isOpen={sleepModalOpen}
                onClose={() => setSleepModalOpen(false)}
                sleepData={data.rawSleepData}
            />

            {/* STAGE 4: VOLUME & BENCHMARKS ARCHITECTURE */}
            <section className="space-y-12">
                <div className="space-y-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Background Architecture</span>
                    <h2 className="text-4xl font-serif text-foreground tracking-tight">Macro-Cycle Progression</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 bg-card rounded-[48px] p-12 md:p-16 border border-border shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-end mb-12">
                            <div className="flex gap-12">
                                <div>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Total Tonnage Arc</p>
                                    <p className="text-5xl font-serif text-foreground tracking-tighter">
                                        {(units === 'metric'
                                            ? (data.weeklyTonnage.reduce((a, b) => a + b, 0) / 1000 * 0.453592).toFixed(1)
                                            : (data.weeklyTonnage.reduce((a, b) => a + b, 0) / 1000).toFixed(1)
                                        )} <span className="text-lg">{units === 'metric' ? 'k/kg' : 'k/lbs'}</span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Work Density</p>
                                    <p className="text-5xl font-serif text-muted-foreground italic tracking-tighter">High</p>
                                </div>
                            </div>
                        </div>
                        <ProgressionBarChart
                            data={units === 'metric'
                                ? data.weeklyTonnage.map(v => v * 0.453592)
                                : data.weeklyTonnage
                            }
                            height={250}
                            color="bg-primary"
                            units={getUnitLabel(units, 'weight')}
                        />
                    </div>

                    <div className="lg:col-span-1">
                        <PRHistory onOpenSpectrum={(history: any[]) => {
                            setPrHistory(history);
                            setPrModalOpen(true);
                        }} />
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
        </div>
    );
}
