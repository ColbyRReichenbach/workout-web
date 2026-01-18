"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Moon, Heart, Brain, Zap, TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";
import { PremiumAreaChart } from "./AnalyticsCharts";
import { useEffect } from "react";

interface SleepData {
    date: string;
    asleep_minutes: number;
    hrv_ms: number;
    resting_hr: number;
    deep_sleep_minutes?: number;
    rem_sleep_minutes?: number;
    core_sleep_minutes?: number;
    awake_minutes?: number;
    sleep_efficiency_score?: number;
    avg_hr_sleeping?: number;
    respiratory_rate?: number;
}

interface SleepAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    sleepData: SleepData[];
}

const TrendIcon = ({ value }: { value: number }) => {
    if (value > 3) return <TrendingUp size={14} className="text-green-500" />;
    if (value < -3) return <TrendingDown size={14} className="text-red-500" />;
    return <Minus size={14} className="text-muted-foreground" />;
};

export function SleepAnalysisModal({ isOpen, onClose, sleepData }: SleepAnalysisModalProps) {
    // Get last 30 days of sleep data
    const recentSleep = sleepData.slice(-30);

    // Prevent background scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Calculate averages
    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    // Check if we have sleep stage data (any non-null values)
    const hasDeepData = recentSleep.some(s => s.deep_sleep_minutes && s.deep_sleep_minutes > 0);
    const hasRemData = recentSleep.some(s => s.rem_sleep_minutes && s.rem_sleep_minutes > 0);
    const hasCoreData = recentSleep.some(s => s.core_sleep_minutes && s.core_sleep_minutes > 0);
    const hasSleepStages = hasDeepData || hasRemData || hasCoreData;

    const avgDeep = avg(recentSleep.map(s => s.deep_sleep_minutes || 0).filter(v => v > 0));
    const avgRem = avg(recentSleep.map(s => s.rem_sleep_minutes || 0).filter(v => v > 0));
    const avgCore = avg(recentSleep.map(s => s.core_sleep_minutes || 0).filter(v => v > 0));
    const avgHrv = avg(recentSleep.map(s => Number(s.hrv_ms) || 0).filter(v => v > 0));
    const avgRestingHr = avg(recentSleep.map(s => Number(s.resting_hr) || 0).filter(v => v > 0));
    const avgTotal = avg(recentSleep.map(s => s.asleep_minutes || 0).filter(v => v > 0));

    // Trends (compare last 7 days to previous 7 days)
    const last7 = recentSleep.slice(-7);
    const prev7 = recentSleep.slice(-14, -7);

    const calcTrend = (key: keyof SleepData) => {
        const last = avg(last7.map(s => Number(s[key]) || 0));
        const prev = avg(prev7.map(s => Number(s[key]) || 0));
        if (prev === 0) return 0;
        return ((last - prev) / prev) * 100;
    };

    const hrvTrend = calcTrend('hrv_ms');
    const durationTrend = calcTrend('asleep_minutes');

    // Format minutes to hours and minutes
    const formatDuration = (mins: number) => {
        if (mins === 0) return "—";
        const h = Math.floor(mins / 60);
        const m = Math.round(mins % 60);
        return `${h}h ${m}m`;
    };

    // Sleep architecture percentages
    const totalSleepMins = avgDeep + avgRem + avgCore;
    const deepPct = totalSleepMins > 0 ? (avgDeep / totalSleepMins) * 100 : 0;
    const remPct = totalSleepMins > 0 ? (avgRem / totalSleepMins) * 100 : 0;
    const corePct = totalSleepMins > 0 ? (avgCore / totalSleepMins) * 100 : 0;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[200]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-x-4 top-24 bottom-4 md:inset-x-10 md:top-32 md:bottom-10 lg:inset-x-20 lg:top-40 lg:bottom-20 bg-card rounded-[48px] z-[200] overflow-hidden shadow-2xl flex flex-col border border-border"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-8 md:p-12 border-b border-border">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                    <Moon size={32} />
                                </div>
                                <div>
                                    <h2 className="text-4xl font-serif text-foreground">Sleep Depth Analysis</h2>
                                    <p className="text-muted-foreground text-sm font-light italic mt-1">30-Day Biometric Sleep Intelligence</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12">

                            {/* Sleep Architecture */}
                            <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    <div>
                                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Sleep Architecture</h3>
                                        <p className="text-muted-foreground text-sm font-light leading-relaxed">
                                            Your sleep is composed of distinct phases. Deep sleep is crucial for physical recovery,
                                            REM for cognitive restoration, and Core (light) sleep for memory consolidation.
                                        </p>
                                    </div>

                                    {/* Sleep Stage Bars */}
                                    {!hasSleepStages ? (
                                        <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 flex items-start gap-4">
                                            <AlertCircle size={20} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-amber-700 font-medium text-sm">Sleep Stage Data Not Yet Imported</p>
                                                <p className="text-amber-600 text-xs font-light mt-1">
                                                    Sleep stage breakdown (Deep, REM, Core) requires watchOS 9+ and HealthKit export.
                                                    Import your data to see detailed stage analysis.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {[
                                                { label: "Deep Sleep", value: avgDeep, pct: deepPct, color: "bg-indigo-600", target: 90, icon: Brain },
                                                { label: "REM Sleep", value: avgRem, pct: remPct, color: "bg-violet-500", target: 105, icon: Zap },
                                                { label: "Core Sleep", value: avgCore, pct: corePct, color: "bg-sky-400", target: 240, icon: Moon }
                                            ].map(stage => (
                                                <div key={stage.label} className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-3">
                                                            <stage.icon size={16} className="text-muted-foreground" />
                                                            <span className="text-sm font-medium text-foreground">{stage.label}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-lg font-serif text-foreground">{formatDuration(stage.value)}</span>
                                                            <span className="text-[10px] text-muted-foreground">({stage.pct.toFixed(0)}%)</span>
                                                        </div>
                                                    </div>
                                                    <div className="h-3 bg-muted rounded-full overflow-hidden relative">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.min(100, (stage.value / stage.target) * 100)}%` }}
                                                            transition={{ duration: 1, ease: "circOut" }}
                                                            className={`h-full ${stage.color} rounded-full`}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between text-[9px] text-muted-foreground">
                                                        <span>0</span>
                                                        <span>Target: {formatDuration(stage.target)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Biometric Cards - Only show what we track */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* HRV Card */}
                                    <div className="bg-rose-500/10 rounded-3xl p-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Heart size={20} className="text-rose-500" />
                                            <TrendIcon value={hrvTrend} />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-serif text-foreground">{avgHrv > 0 ? `${Math.round(avgHrv)} ms` : "—"}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">HRV</p>
                                        </div>
                                        <div className={`text-[9px] font-bold uppercase tracking-widest ${avgHrv >= 50 ? 'text-green-500' : avgHrv >= 35 ? 'text-amber-500' : 'text-rose-500'}`}>
                                            {avgHrv >= 50 ? "Optimal" : avgHrv >= 35 ? "Normal" : avgHrv > 0 ? "Recovery" : "Awaiting Data"}
                                        </div>
                                    </div>

                                    {/* Resting HR Card */}
                                    <div className="bg-red-500/10 rounded-3xl p-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Heart size={20} className="text-red-500" />
                                            <TrendIcon value={-calcTrend('resting_hr')} />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-serif text-foreground">{avgRestingHr > 0 ? `${Math.round(avgRestingHr)} bpm` : "—"}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Resting HR</p>
                                        </div>
                                        <div className={`text-[9px] font-bold uppercase tracking-widest ${avgRestingHr > 0 && avgRestingHr < 55 ? 'text-green-500' : avgRestingHr < 65 ? 'text-amber-500' : 'text-red-500'}`}>
                                            {avgRestingHr > 0 && avgRestingHr < 55 ? "Athletic" : avgRestingHr > 0 && avgRestingHr < 65 ? "Normal" : avgRestingHr > 0 ? "Elevated" : "Awaiting Data"}
                                        </div>
                                    </div>

                                    {/* Total Sleep Card */}
                                    <div className="bg-indigo-500/10 rounded-3xl p-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Moon size={20} className="text-indigo-500" />
                                            <TrendIcon value={durationTrend} />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-serif text-foreground">{formatDuration(avgTotal)}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Avg Duration</p>
                                        </div>
                                        <div className={`text-[9px] font-bold uppercase tracking-widest ${avgTotal >= 420 && avgTotal <= 540 ? 'text-green-500' : avgTotal >= 360 ? 'text-amber-500' : 'text-red-500'}`}>
                                            {avgTotal >= 420 && avgTotal <= 540 ? "Optimal" : avgTotal >= 360 ? "Adequate" : avgTotal > 0 ? "Low" : "Awaiting Data"}
                                        </div>
                                    </div>

                                    {/* Consistency Card */}
                                    <div className="bg-muted rounded-3xl p-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Moon size={20} className="text-muted-foreground" />
                                            <Minus size={14} className="text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-serif text-foreground">{recentSleep.length}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Nights Tracked</p>
                                        </div>
                                        <div className={`text-[9px] font-bold uppercase tracking-widest ${recentSleep.length >= 25 ? 'text-green-500' : recentSleep.length >= 14 ? 'text-amber-500' : 'text-stone-400'}`}>
                                            {recentSleep.length >= 25 ? "Consistent" : recentSleep.length >= 14 ? "Building" : "Keep Tracking"}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* HRV Trend Chart */}
                            <section className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">HRV Trend</h3>
                                        <p className="text-muted-foreground text-xs font-light">Higher HRV indicates better recovery capacity</p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">7-Day Trend:</span>
                                        <span className={`text-sm font-serif ${hrvTrend > 0 ? 'text-green-500' : hrvTrend < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                                            {hrvTrend > 0 ? '+' : ''}{hrvTrend.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-muted/30 rounded-[32px] p-8 border border-border">
                                    <PremiumAreaChart
                                        data={recentSleep.map(s => Number(s.hrv_ms) || 0)}
                                        color="#6366f1"
                                        height={200}
                                        units=" ms"
                                    />
                                </div>
                            </section>

                            {/* Sleep Duration Trend */}
                            <section className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Sleep Duration Trend</h3>
                                        <p className="text-muted-foreground text-xs font-light">Tracking total sleep time consistency</p>
                                    </div>
                                    <div className="bg-muted px-4 py-2 rounded-full">
                                        <span className="text-sm font-serif text-foreground">Avg: {formatDuration(avgTotal)}</span>
                                    </div>
                                </div>
                                <div className="bg-muted/30 rounded-[32px] p-8 border border-border">
                                    <PremiumAreaChart
                                        data={recentSleep.map(s => (s.asleep_minutes || 0) / 60)}
                                        color="#78716c"
                                        height={150}
                                        units="h"
                                    />
                                </div>
                            </section>

                            {/* Insights - Only show relevant ones */}
                            <section className="bg-indigo-500/5 rounded-[32px] p-8 border border-indigo-500/10">
                                <h3 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-4">Sleep Intelligence Summary</h3>
                                <div className="space-y-4 text-muted-foreground text-sm leading-relaxed">
                                    {avgHrv > 0 && avgHrv < 40 && (
                                        <p>⚠️ <strong>HRV is indicating stress accumulation.</strong> Consider a deload week or additional recovery modalities.</p>
                                    )}
                                    {avgHrv >= 55 && (
                                        <p>✅ <strong>HRV is in the athletic range.</strong> Your parasympathetic recovery is strong.</p>
                                    )}
                                    {avgTotal > 420 && avgTotal <= 540 && (
                                        <p>✅ <strong>Sleep duration is optimal (7-9 hours).</strong> Maintain this consistency for peak performance.</p>
                                    )}
                                    {avgTotal > 0 && avgTotal < 420 && (
                                        <p>⚠️ <strong>You&apos;re sleeping less than 7 hours on average.</strong> This may impair strength gains and cognitive function.</p>
                                    )}
                                    {avgRestingHr > 0 && avgRestingHr < 55 && (
                                        <p>✅ <strong>Resting heart rate is in the athletic zone.</strong> Strong cardiovascular adaptation evident.</p>
                                    )}
                                    {recentSleep.length < 14 && (
                                        <p>💡 <strong>Keep tracking!</strong> More data will unlock deeper insights into your sleep patterns.</p>
                                    )}
                                    {!hasSleepStages && recentSleep.length >= 14 && (
                                        <p>💡 <strong>Import sleep stages from HealthKit</strong> to see your Deep, REM, and Core sleep breakdown.</p>
                                    )}
                                </div>
                            </section>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
