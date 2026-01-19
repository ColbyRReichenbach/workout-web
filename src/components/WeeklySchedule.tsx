"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, Dumbbell, Clock, Flame, HeartPulse, Target, Activity, Zap, TrendingUp, Flower2, Footprints, Moon, Trophy, LucideIcon } from "lucide-react";
import { memo, useEffect, createElement } from "react";
import { TiltCard } from "./TiltCard";
import { useSettings } from "@/context/SettingsContext";
import { toDisplayWeight, toDisplayDistance, getUnitLabel } from "@/lib/conversions";
import { isCheckpointWeek, getCheckpointData } from "@/lib/checkpointTests";

import { WorkoutLog, ProtocolDay } from "@/lib/types";

interface DayCardProps {
    day: ProtocolDay;
    index?: number;
    isToday: boolean;
    isDone: boolean;
    isPast: boolean;
    phase?: number;
    currentWeek?: number; // For checkpoint detection
    onClick: () => void;
}

interface SetData {
    weight?: number;
    reps?: number;
    rpe?: number;
    distance?: number;
    calories?: number;
}

interface PerformanceData {
    sets?: SetData[];
    rounds?: number;
    weight?: number;
    reps?: number;
    distance?: number;
    duration_min?: number;
}

const TYPE_STYLES: Record<string, { bg: string, text: string, shadow: string, tint: string, icon: LucideIcon }> = {
    "Strength": { bg: "bg-red-500/5", text: "text-red-600", shadow: "shadow-red-500/10", tint: "bg-red-500/10", icon: Dumbbell },
    "Hypertrophy": { bg: "bg-orange-500/5", text: "text-orange-600", shadow: "shadow-orange-500/10", tint: "bg-orange-500/10", icon: TrendingUp },
    "Cardio": { bg: "bg-emerald-500/5", text: "text-emerald-600", shadow: "shadow-emerald-500/10", tint: "bg-emerald-500/10", icon: Footprints },
    "Recovery": { bg: "bg-blue-500/5", text: "text-blue-600", shadow: "shadow-blue-500/10", tint: "bg-blue-500/10", icon: Flower2 },
    "Power": { bg: "bg-rose-500/5", text: "text-rose-600", shadow: "shadow-rose-500/10", tint: "bg-rose-500/10", icon: Zap },
    "Endurance": { bg: "bg-sky-500/5", text: "text-sky-600", shadow: "shadow-sky-500/10", tint: "bg-sky-500/10", icon: Target },
    "Rest": { bg: "bg-muted/30", text: "text-muted-foreground", shadow: "shadow-black/5", tint: "bg-muted/50", icon: Moon },
};

const getRepresentativeIcon = (day: ProtocolDay, phase: number) => {
    const title = day.title.toLowerCase();
    const dayName = day.day.toLowerCase();
    const type = day.type.toLowerCase();

    // Hardcoded Global Overrides
    if (dayName === 'sunday' || type === 'rest' || title.includes('rest')) return Moon;

    // Phase-Aware Hardcoded Logic
    if (phase === 1) {
        if (dayName === 'thursday') return Flower2; // Active Mobility
        if (dayName === 'saturday') return Footprints; // Ruck
    }

    if (phase === 2) {
        if (dayName === 'tuesday' || dayName === 'saturday') return Footprints; // Track Speed / Simulation
        if (dayName === 'thursday') return Flower2; // Active Flush (Yoga/Swim vibe)
    }

    // Semantic Fallback
    if (title.includes('run') || title.includes('sprint') || title.includes('jog') || title.includes('ruck')) return Footprints;
    if (title.includes('yoga') || title.includes('stretch') || title.includes('mobility') || title.includes('flow')) return Flower2;
    if (title.includes('rest') || title.includes('sleep') || title.includes('recovery day')) return Moon;
    if (title.includes('swim')) return Activity;

    return TYPE_STYLES[day.type]?.icon || TYPE_STYLES["Strength"].icon;
};

const DayIcon = memo(function DayIcon({ day, phase, ...props }: { day: ProtocolDay; phase: number } & React.ComponentProps<LucideIcon>) {
    return createElement(getRepresentativeIcon(day, phase), props);
});

export const DayCard = memo(function DayCard({ day, isToday, isDone, isPast, phase = 1, currentWeek, onClick }: DayCardProps) {
    // Checkpoint Detection: Is this Saturday in a checkpoint week?
    const isCheckpointDay = currentWeek && isCheckpointWeek(currentWeek) && day.day === "Saturday";
    const checkpointData = isCheckpointDay ? getCheckpointData(currentWeek) : null;

    // Override style for checkpoint days
    const style = isCheckpointDay
        ? { bg: "bg-amber-500/5", text: "text-amber-600", shadow: "shadow-amber-500/20", tint: "bg-amber-500/10", icon: Trophy }
        : TYPE_STYLES[day.type] || TYPE_STYLES["Strength"];

    // Override title for checkpoint days
    const displayTitle = isCheckpointDay ? "Checkpoint Testing" : day.title;
    const displaySubtitle = isCheckpointDay && checkpointData
        ? checkpointData.tests.slice(0, 2).map(t => t.name).join(" • ")
        : null;

    return (
        <TiltCard
            glowColor={style.shadow}
            className={`
                relative p-8 rounded-[48px] cursor-pointer overflow-hidden group bg-card
                ${isCheckpointDay ? "border-2 border-amber-500" : "border border-border"}
                ${isToday ? "ring-2 ring-primary/20 ring-offset-4" : ""}
                ${isDone ? "opacity-100" : isPast ? "opacity-60" : ""}
            `}
        >
            <div onClick={onClick}>
                {/* Background Icon Watermark */}
                <div className={`absolute -right-8 -bottom-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-300 pointer-events-none ${style.text}`} style={{ willChange: 'opacity' }}>
                    <DayIcon day={day} phase={phase} size={160} strokeWidth={1} />
                </div>

                {/* Content */}
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-[10px] font-bold uppercase tracking-[0.3em] ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                                    {day.day}
                                </span>
                                {isToday && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                            </div>
                            <h4 className="font-serif text-3xl text-foreground leading-tight">
                                {displayTitle}
                            </h4>
                            {displaySubtitle && (
                                <p className="text-xs text-amber-600 mt-1 font-medium">
                                    {displaySubtitle}
                                </p>
                            )}
                        </div>

                        {isDone ? (
                            <div className="h-14 w-14 rounded-[20px] bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-200">
                                <CheckCircle size={28} />
                            </div>
                        ) : isPast ? (
                            <div className="h-14 w-14 rounded-[20px] bg-red-500/5 flex items-center justify-center border border-red-500/10 group-hover:bg-red-500 group-hover:text-white transition-colors duration-200">
                                <X size={24} />
                            </div>
                        ) : (
                            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${isToday ? "bg-primary/10 border border-primary/20 text-primary shadow-lg shadow-primary/10" : "bg-card border border-border text-muted-foreground shadow-sm"
                                }`}>
                                <DayIcon day={day} phase={phase} size={26} className={isToday ? "animate-[pulse_2s_infinite]" : ""} />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <span className={`px-4 py-1.5 ${style.tint} ${style.text} rounded-full text-[10px] font-bold uppercase tracking-widest`}>
                            {day.type.replace('_', ' ')} Protocol
                        </span>
                        {isDone && (
                            <span className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                                <div className="w-1 h-1 rounded-full bg-emerald-500" /> Synchronized
                            </span>
                        )}
                    </div>
                </div>

                {/* Hover visual cue removed as per user request */}
            </div>
        </TiltCard>
    );
});

interface DayDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    day: ProtocolDay | null;
    isDone: boolean;
    isToday: boolean;
    logs: WorkoutLog[];
}

export function DayDetailModal({ isOpen, onClose, day, isDone, isToday, logs }: DayDetailModalProps) {
    const { units } = useSettings();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!day) return null;

    const isCardio = day.type === "Cardio" || day.type === "Endurance" || day.type === "Recovery";
    const weightLabel = getUnitLabel(units, 'weight');
    const distLabel = getUnitLabel(units, 'distance');

    // Calculate real stats from logs
    const totalSets = logs.reduce((acc, log) => {
        const pd = log.performance_data || {};
        if (pd.sets && Array.isArray(pd.sets)) return acc + pd.sets.length;
        return acc + 1;
    }, 0);

    // For Cardio: Sum distance, time, and find best pace
    const totalDistance = logs.reduce((acc, log) => acc + (Number(log.performance_data?.distance) || 0), 0);
    const totalTime = logs.reduce((acc, log) => acc + (Number(log.performance_data?.duration_min) || 0), 0);
    const totalCals = logs.reduce((acc, log) => {
        const pd = log.performance_data || {};
        return acc + (Number(pd.calories) || Number(pd.rounds) || 0); // Use rounds as a proxy for 'effort units' if cals missing
    }, 0);

    // For Strength: Sum volume
    const totalVolume = logs.reduce((acc, log) => {
        const pd = log.performance_data || {};
        if (pd.sets && Array.isArray(pd.sets)) {
            const setVolume = pd.sets.reduce((sAcc: number, s: SetData) => sAcc + ((Number(s.weight) || 0) * (Number(s.reps) || 0)), 0);
            return acc + setVolume;
        }
        const weight = Number(pd.weight) || 0;
        const reps = Number(pd.reps) || 0;
        return acc + (weight * reps);
    }, 0);

    const avgRpe = logs.length > 0
        ? (logs.reduce((acc, log) => acc + (Number(log.performance_data?.rpe) || 0), 0) / logs.length).toFixed(1)
        : "—";

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
                        className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[200]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 40 }}
                        className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] z-[210] w-[95vw] max-w-[680px] max-h-[calc(100vh-10rem)] mt-10 flex flex-col"
                    >
                        <div className="glass-card bg-card border-border rounded-[48px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.2)] relative overflow-hidden flex flex-col max-h-full">
                            {/* Decorative Background Pulsar */}
                            <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none animate-pulse" />

                            {/* Header */}
                            <div className="p-10 pb-4 relative z-10 flex justify-between items-start">
                                <div className="space-y-2">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.3em]">{day.day} Rhythm</span>
                                    <h2 className="font-serif text-5xl text-foreground leading-tight">{day.title}</h2>
                                    <div className="flex gap-2 items-center">
                                        <span className="px-4 py-1.5 bg-muted text-muted-foreground rounded-full text-[10px] font-bold uppercase tracking-widest">
                                            {day.type.replace('_', ' ')} Protocol
                                        </span>
                                        {isDone && (
                                            <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Synchronized
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="h-12 w-12 rounded-2xl bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors border border-border"
                                >
                                    <X size={20} className="text-muted-foreground" />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="p-10 pt-4 overflow-y-auto relative z-10 flex-1">
                                {isDone ? (
                                    <div className="space-y-10">
                                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-8 flex items-center gap-6">
                                            <div className="w-16 h-16 rounded-[24px] bg-emerald-500/10 flex items-center justify-center">
                                                <CheckCircle className="text-emerald-500" size={32} />
                                            </div>
                                            <div>
                                                <h4 className="text-foreground font-bold uppercase text-xs tracking-widest">Efficiency Optimized</h4>
                                                <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
                                                    Session verified in master history. Performance metrics have been indexed into your biometric spectrum.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-3 gap-6">
                                            <div className="bg-muted/30 rounded-3xl p-6 text-center border border-border">
                                                {isCardio ? <Clock className="mx-auto text-primary/40 mb-3" size={24} /> : <Dumbbell className="mx-auto text-primary/40 mb-3" size={24} />}
                                                <div className="text-3xl font-serif text-foreground">{isCardio ? totalTime : totalSets}</div>
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{isCardio ? "Mins" : "Segments"}</div>
                                            </div>
                                            <div className="bg-muted/30 rounded-3xl p-6 text-center border border-border">
                                                <Activity className="mx-auto text-muted-foreground/50 mb-3" size={24} />
                                                <div className="text-3xl font-serif text-foreground">
                                                    {isCardio
                                                        ? toDisplayDistance(totalDistance, units)
                                                        : (totalVolume > 0 ? `${(toDisplayWeight(totalVolume, units)! / 1000).toFixed(1)}k` : "—")
                                                    }
                                                </div>
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{isCardio ? distLabel : `Volume (${weightLabel})`}</div>
                                            </div>
                                            <div className="bg-muted/30 rounded-3xl p-6 text-center border border-border">
                                                {isCardio ? <HeartPulse className="mx-auto text-rose-400/40 mb-3" size={24} /> : <Flame className="mx-auto text-orange-400/40 mb-3" size={24} />}
                                                <div className="text-3xl font-serif text-foreground">{isCardio ? totalCals : avgRpe}</div>
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{isCardio ? "Cals" : "Avg RPE"}</div>
                                            </div>
                                        </div>

                                        {/* Logged Exercises */}
                                        <div className="space-y-6">
                                            <h4 className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold px-2">Performance Briefing</h4>
                                            <div className="space-y-3">
                                                {logs.map((log, i) => (
                                                    <div key={i} className="bg-card rounded-2xl p-5 flex justify-between items-center border border-border shadow-sm">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
                                                            <span className="text-foreground font-serif text-lg italic">{log.segment_name}</span>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2">
                                                            {(log.performance_data as PerformanceData)?.sets && Array.isArray((log.performance_data as PerformanceData).sets) ? (
                                                                <div className="flex flex-wrap gap-1.5 justify-end max-w-[250px]">

                                                                    {((log.performance_data as PerformanceData).sets as SetData[]).map((s, si) => (
                                                                        <span key={si} className="text-[9px] bg-muted border border-border px-2 py-1 rounded-md text-muted-foreground font-serif">
                                                                            {String(toDisplayWeight(s.weight || 0, units))}{weightLabel} × {String(s.reps || 0)}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-4">
                                                                    {(log.performance_data as PerformanceData)?.rounds && (
                                                                        <span className="text-foreground font-serif text-xl">{String((log.performance_data as PerformanceData).rounds)}<span className="text-xs text-muted-foreground font-sans ml-0.5 mt-1">r</span></span>
                                                                    )}
                                                                    {(log.performance_data as PerformanceData)?.weight && (
                                                                        <span className="text-foreground font-serif text-xl">{String(toDisplayWeight((log.performance_data as PerformanceData).weight || 0, units))}<span className="text-xs text-muted-foreground font-sans ml-0.5 mt-1">{weightLabel}</span></span>
                                                                    )}
                                                                    {(log.performance_data as PerformanceData)?.reps && (
                                                                        <span className="text-muted-foreground font-sans text-sm">× {String((log.performance_data as PerformanceData).reps)} reps</span>
                                                                    )}
                                                                    {(log.performance_data as PerformanceData)?.distance && (
                                                                        <span className="text-foreground font-serif text-xl">{toDisplayDistance((log.performance_data as PerformanceData).distance || 0, units)}<span className="text-xs text-muted-foreground font-sans ml-0.5 mt-1">{distLabel}</span></span>
                                                                    )}
                                                                    {(log.performance_data as PerformanceData)?.duration_min && (
                                                                        <span className="text-muted-foreground font-sans text-sm">in {String((log.performance_data as PerformanceData).duration_min)}m</span>
                                                                    )}
                                                                    {!(log.performance_data as PerformanceData)?.weight && !(log.performance_data as PerformanceData)?.reps && !(log.performance_data as PerformanceData)?.distance && !(log.performance_data as PerformanceData)?.rounds && (
                                                                        <span className="text-emerald-500 font-bold uppercase text-[10px] tracking-widest">Completed</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Edit Workout Button */}
                                        <div className="pt-4 border-t border-border">
                                            <button
                                                onClick={() => window.location.href = `/workout?retroactive=true&day=${day.day}`}
                                                className="w-full py-4 rounded-2xl bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground font-bold text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                Edit This Workout
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-10">
                                        <div className="space-y-4">
                                            <p className="text-muted-foreground text-xl font-light leading-relaxed italic">
                                                &quot;The resistance you face today is the foundation of the strength you reveal tomorrow.&quot;
                                            </p>
                                            <p className="text-muted-foreground text-sm leading-relaxed">
                                                Your <span className="text-primary font-bold">{day.title}</span> protocol is currently pending initiation.
                                            </p>
                                        </div>

                                        <div className="space-y-4 pt-6">
                                            {isToday && (
                                                <button
                                                    onClick={() => window.location.href = "/workout"}
                                                    className="w-full py-8 rounded-[36px] bg-primary text-primary-foreground font-bold text-2xl transition-all btn-pro shadow-[0_20px_40px_-10px_rgba(239,68,68,0.3)] hover:shadow-[0_25px_50px_-12px_rgba(239,68,68,0.5)] flex items-center justify-center gap-4"
                                                >
                                                    Initiate Pulse Protocol
                                                    <Target size={24} />
                                                </button>
                                            )}

                                            {!day.isFuture ? (
                                                <button
                                                    onClick={() => window.location.href = "/workout?retroactive=true&day=" + day.day}
                                                    className="w-full py-6 rounded-[32px] bg-muted text-muted-foreground font-bold text-sm tracking-widest uppercase hover:text-foreground hover:bg-muted/80 transition-all border border-border"
                                                >
                                                    Manual Back-Fill {isToday ? "(Missed)" : ""}
                                                </button>
                                            ) : (
                                                <div className="bg-muted/30 border border-border rounded-3xl p-6 mb-2">
                                                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest text-center">Protocol Locked</p>
                                                    <p className="text-muted-foreground text-[10px] text-center mt-1 italic leading-relaxed px-4">This session will synchronize with your baseline at the scheduled time.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
