"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, Dumbbell, Clock, Flame, HeartPulse, Target, Activity } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface DayCardProps {
    day: { day: string; title: string; type: string };
    index: number;
    isToday: boolean;
    isDone: boolean;
    isPast: boolean;
    onClick: () => void;
}

export function DayCard({ day, index, isToday, isDone, isPast, onClick }: DayCardProps) {
    const typeStyles: Record<string, { bg: string, text: string, shadow: string, tint: string }> = {
        "Strength": { bg: "bg-red-500/5", text: "text-red-600", shadow: "group-hover:shadow-red-500/20", tint: "bg-red-500/10" },
        "Hypertrophy": { bg: "bg-orange-500/5", text: "text-orange-600", shadow: "group-hover:shadow-orange-500/20", tint: "bg-orange-500/10" },
        "Cardio": { bg: "bg-emerald-500/5", text: "text-emerald-600", shadow: "group-hover:shadow-emerald-500/20", tint: "bg-emerald-500/10" },
        "Recovery": { bg: "bg-stone-500/5", text: "text-stone-600", shadow: "group-hover:shadow-stone-500/20", tint: "bg-stone-500/10" },
        "Power": { bg: "bg-rose-500/5", text: "text-rose-600", shadow: "group-hover:shadow-rose-500/20", tint: "bg-rose-500/10" },
        "Endurance": { bg: "bg-sky-500/5", text: "text-sky-600", shadow: "group-hover:shadow-sky-500/20", tint: "bg-sky-500/10" },
        "Rest": { bg: "bg-stone-100/30", text: "text-stone-400", shadow: "group-hover:shadow-stone-900/5", tint: "bg-stone-200/50" },
    };

    const style = typeStyles[day.type] || typeStyles["Strength"];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={onClick}
            whileHover={{ y: -8, scale: 1.02 }}
            className={`
                relative p-8 rounded-[40px] border cursor-pointer
                bg-white/80 backdrop-blur-2xl border-black/[0.03]
                transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
                hover:border-black/10 hover:shadow-2xl ${style.shadow}
                ${isToday ? "ring-2 ring-primary/20 ring-offset-4" : ""}
                ${isDone ? "opacity-100" : isPast ? "opacity-60" : ""}
                group overflow-hidden
            `}
        >
            {/* Dynamic Type Tint - Active on Hover */}
            <div className={`absolute inset-0 ${style.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

            {/* Content */}
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] font-bold uppercase tracking-[0.3em] ${isToday ? "text-primary" : "text-stone-400"}`}>
                                {day.day}
                            </span>
                            {isToday && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                        </div>
                        <h4 className="font-serif text-3xl text-stone-900 leading-tight">
                            {day.title}
                        </h4>
                    </div>

                    {isDone ? (
                        <div className="h-14 w-14 rounded-[20px] bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                            <CheckCircle size={28} />
                        </div>
                    ) : isPast ? (
                        <div className="h-14 w-14 rounded-[20px] bg-red-500/5 flex items-center justify-center border border-red-500/10 group-hover:bg-red-500 group-hover:text-white transition-all duration-300">
                            <X size={24} />
                        </div>
                    ) : (
                        <div className={`h-14 w-14 rounded-[20px] flex items-center justify-center transition-all duration-300 ${isToday ? "bg-primary/10 border border-primary/20 text-primary" : "bg-stone-50 border border-black/[0.03] text-stone-300"
                            }`}>
                            <HeartPulse size={26} className={isToday ? "animate-[pulse_2s_infinite]" : ""} />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <span className={`px-4 py-1.5 ${style.tint} ${style.text} rounded-full text-[10px] font-bold uppercase tracking-widest`}>
                        {day.type} Protocol
                    </span>
                    {isDone && (
                        <span className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                            <div className="w-1 h-1 rounded-full bg-emerald-500" /> Synchronized
                        </span>
                    )}
                </div>
            </div>

            {/* Hover visual cue */}
            <div className="absolute bottom-6 right-8 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2">
                    Access Protocol <div className="w-4 h-[1px] bg-stone-300" />
                </span>
            </div>
        </motion.div>
    );
}

interface DayDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    day: { day: string; title: string; type: string } | null;
    isDone: boolean;
    isToday: boolean;
    logs: any[];
}

export function DayDetailModal({ isOpen, onClose, day, isDone, isToday, logs }: DayDetailModalProps) {
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
            const setVolume = pd.sets.reduce((sAcc: number, s: any) => sAcc + ((Number(s.weight) || 0) * (Number(s.reps) || 0)), 0);
            return acc + setVolume;
        }
        const weight = Number(pd.weight) || 0;
        const reps = Number(pd.reps) || 0;
        return acc + (weight * reps);
    }, 0);

    const avgRpe = logs.length > 0
        ? (logs.reduce((acc, log) => acc + (log.performance_data?.rpe || 0), 0) / logs.length).toFixed(1)
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
                        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xl z-[200]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] z-[210] w-[95vw] max-w-[640px] max-h-[90vh] flex flex-col"
                    >
                        <div className="bg-white border border-black/5 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col max-h-full">
                            {/* Decorative Background Pulsar */}
                            <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                            {/* Header */}
                            <div className="p-10 pb-4 relative z-10 flex justify-between items-start">
                                <div className="space-y-2">
                                    <span className="text-[10px] text-stone-400 uppercase font-bold tracking-[0.3em]">{day.day} Rhythm</span>
                                    <h2 className="font-serif text-5xl text-stone-900 leading-tight">{day.title}</h2>
                                    <div className="flex gap-2 items-center">
                                        <span className="px-4 py-1.5 bg-stone-100 text-stone-500 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                            {day.type} Protocol
                                        </span>
                                        {isDone && (
                                            <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Synchronized
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="h-12 w-12 rounded-2xl bg-stone-50 hover:bg-stone-100 flex items-center justify-center transition-colors border border-black/[0.02]"
                                >
                                    <X size={20} className="text-stone-400" />
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
                                                <h4 className="text-stone-900 font-bold uppercase text-xs tracking-widest">Efficiency Optimized</h4>
                                                <p className="text-stone-500 text-sm mt-1 leading-relaxed">
                                                    Session verified in master history. Performance metrics have been indexed into your biometric spectrum.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-3 gap-6">
                                            <div className="bg-stone-50/50 rounded-3xl p-6 text-center border border-black/[0.02]">
                                                {isCardio ? <Clock className="mx-auto text-primary/40 mb-3" size={24} /> : <Dumbbell className="mx-auto text-primary/40 mb-3" size={24} />}
                                                <div className="text-3xl font-serif text-stone-900">{isCardio ? totalTime : totalSets}</div>
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mt-1">{isCardio ? "Mins" : "Segments"}</div>
                                            </div>
                                            <div className="bg-stone-50/50 rounded-3xl p-6 text-center border border-black/[0.02]">
                                                <Activity className="mx-auto text-stone-300 mb-3" size={24} />
                                                <div className="text-3xl font-serif text-stone-900">
                                                    {isCardio
                                                        ? (totalDistance > 0 ? totalDistance.toFixed(1) : "—")
                                                        : (totalVolume > 0 ? `${(totalVolume / 1000).toFixed(1)}k` : "—")
                                                    }
                                                </div>
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mt-1">{isCardio ? "Miles" : "Volume (lb)"}</div>
                                            </div>
                                            <div className="bg-stone-50/50 rounded-3xl p-6 text-center border border-black/[0.02]">
                                                {isCardio ? <HeartPulse className="mx-auto text-rose-400/40 mb-3" size={24} /> : <Flame className="mx-auto text-orange-400/40 mb-3" size={24} />}
                                                <div className="text-3xl font-serif text-stone-900">{isCardio ? totalCals : avgRpe}</div>
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mt-1">{isCardio ? "Cals" : "Avg RPE"}</div>
                                            </div>
                                        </div>

                                        {/* Logged Exercises */}
                                        <div className="space-y-6">
                                            <h4 className="text-[10px] text-stone-400 uppercase tracking-[0.2em] font-bold px-2">Performance Briefing</h4>
                                            <div className="space-y-3">
                                                {logs.map((log, i) => (
                                                    <div key={i} className="bg-white rounded-2xl p-5 flex justify-between items-center border border-black/[0.03] shadow-sm">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
                                                            <span className="text-stone-800 font-serif text-lg italic">{log.segment_name}</span>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2">
                                                            {log.performance_data?.sets && Array.isArray(log.performance_data.sets) ? (
                                                                <div className="flex flex-wrap gap-1.5 justify-end max-w-[250px]">
                                                                    {log.performance_data.sets.map((s: any, si: number) => (
                                                                        <span key={si} className="text-[9px] bg-stone-50 border border-black/[0.03] px-2 py-1 rounded-md text-stone-500 font-mono">
                                                                            {s.weight}lb × {s.reps}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-4">
                                                                    {log.performance_data?.rounds && (
                                                                        <span className="text-stone-900 font-serif text-xl">{log.performance_data.rounds}<span className="text-xs text-stone-400 font-sans ml-0.5 mt-1">r</span></span>
                                                                    )}
                                                                    {log.performance_data?.weight && (
                                                                        <span className="text-stone-900 font-serif text-xl">{log.performance_data.weight}<span className="text-xs text-stone-400 font-sans ml-0.5 mt-1">lb</span></span>
                                                                    )}
                                                                    {log.performance_data?.reps && (
                                                                        <span className="text-stone-400 font-sans text-sm">× {log.performance_data.reps} reps</span>
                                                                    )}
                                                                    {log.performance_data?.distance && (
                                                                        <span className="text-stone-900 font-serif text-xl">{log.performance_data.distance}<span className="text-xs text-stone-400 font-sans ml-0.5 mt-1">mi</span></span>
                                                                    )}
                                                                    {log.performance_data?.duration_min && (
                                                                        <span className="text-stone-400 font-sans text-sm">in {log.performance_data.duration_min}m</span>
                                                                    )}
                                                                    {!log.performance_data?.weight && !log.performance_data?.reps && !log.performance_data?.distance && !log.performance_data?.rounds && (
                                                                        <span className="text-emerald-500 font-bold uppercase text-[10px] tracking-widest">Completed</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-10">
                                        <div className="space-y-4">
                                            <p className="text-stone-500 text-xl font-light leading-relaxed italic">
                                                "The resistance you face today is the foundation of the strength you reveal tomorrow."
                                            </p>
                                            <p className="text-stone-400 text-sm leading-relaxed">
                                                Your <span className="text-primary font-bold">{day.title}</span> protocol is currently pending initiation.
                                            </p>
                                        </div>

                                        <div className="space-y-4 pt-6">
                                            {isToday && (
                                                <button
                                                    onClick={() => window.location.href = "/workout"}
                                                    className="w-full py-8 rounded-[32px] bg-primary text-white font-bold text-2xl transition-all shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] hover:shadow-primary/30 flex items-center justify-center gap-4"
                                                >
                                                    Initiate Pulse Protocol
                                                    <Target size={24} />
                                                </button>
                                            )}

                                            {!(day as any).isFuture ? (
                                                <button
                                                    onClick={() => window.location.href = "/workout?retroactive=true&day=" + day.day}
                                                    className="w-full py-6 rounded-[32px] bg-stone-50 text-stone-400 font-bold text-sm tracking-widest uppercase hover:text-stone-900 hover:bg-stone-100 transition-all border border-black/[0.02]"
                                                >
                                                    Manual Back-Fill {isToday ? "(Missed)" : ""}
                                                </button>
                                            ) : (
                                                <div className="bg-stone-50 border border-black/[0.02] rounded-3xl p-6 mb-2">
                                                    <p className="text-stone-400 text-xs font-bold uppercase tracking-widest text-center">Protocol Locked</p>
                                                    <p className="text-stone-400 text-[10px] text-center mt-1 italic leading-relaxed px-4">This session will synchronize with your baseline at the scheduled time.</p>
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
