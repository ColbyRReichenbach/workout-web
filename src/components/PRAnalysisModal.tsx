"use client";

import { X, Award, Calendar, TrendingUp, ChevronRight, ArrowLeft, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toDisplayWeight, getUnitLabel } from "@/lib/conversions";
import { useSettings } from "@/context/SettingsContext";
import { useState, useEffect } from "react";

interface PRRecord {
    id: string;
    exercise_name: string;
    value: number;
    unit: string;
    pr_type: string;
    created_at: string;
}

interface PRAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    prs: PRRecord[];
}

export function PRAnalysisModal({ isOpen, onClose, prs }: PRAnalysisModalProps) {
    const { units } = useSettings();
    const [activeTab, setActiveTab] = useState<'all' | 'tonnage' | 'cardio'>('all');
    const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

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

    // Grouping Logic
    const groupedData = prs.reduce((acc, pr) => {
        if (!acc[pr.exercise_name]) {
            acc[pr.exercise_name] = [];
        }
        acc[pr.exercise_name].push(pr);
        return acc;
    }, {} as Record<string, PRRecord[]>);

    // Sort each group by date
    Object.keys(groupedData).forEach(key => {
        groupedData[key].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    });

    const isCardio = (type: string) => ['Distance', 'Time', 'Pace', 'Pwr'].includes(type);

    const filteredExercises = Object.keys(groupedData).filter(name => {
        const latest = groupedData[name][0];
        if (activeTab === 'all') return true;
        if (activeTab === 'tonnage') return latest.pr_type === 'Weight';
        if (activeTab === 'cardio') return isCardio(latest.pr_type);
        return true;
    }).sort((a, b) => {
        const latestA = groupedData[a][0];
        const latestB = groupedData[b][0];
        return new Date(latestB.created_at).getTime() - new Date(latestA.created_at).getTime();
    });

    const formatValue = (value: number, unit: string, type: string) => {
        if (unit === 'sec') {
            const m = Math.floor(value / 60);
            const s = Math.round(value % 60);
            const timeStr = `${m}:${s < 10 ? '0' : ''}${s}`;
            if (type === 'Pace') {
                return `${timeStr}${units === 'metric' ? '/km' : '/mi'}`;
            }
            return timeStr;
        } else if (unit === 'watts') {
            return `${value}w`;
        } else if (type === 'Distance') {
            return `${value.toFixed(2)}${units === 'metric' ? 'km' : 'mi'}`;
        } else {
            return `${toDisplayWeight(value, units)} ${getUnitLabel(units, 'weight')}`;
        }
    };

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
                        className="fixed inset-x-4 top-24 bottom-4 md:inset-x-10 md:top-32 md:bottom-10 lg:inset-x-40 lg:top-40 lg:bottom-20 bg-card rounded-[48px] z-[200] overflow-hidden shadow-2xl flex flex-col border border-border"
                    >
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between p-8 md:p-12 border-b border-border gap-6">
                            <div className="flex items-center gap-6">
                                {selectedExercise ? (
                                    <button
                                        onClick={() => setSelectedExercise(null)}
                                        className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                                    >
                                        <ArrowLeft size={32} />
                                    </button>
                                ) : (
                                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Award size={32} />
                                    </div>
                                )}
                                <div>
                                    <h2 className="text-4xl font-serif text-foreground">
                                        {selectedExercise || "Hall of Power"}
                                    </h2>
                                    <p className="text-muted-foreground text-sm font-light italic mt-1 uppercase tracking-widest">
                                        {selectedExercise ? "Historical Achievement Timeline" : "Full Spectrum Performance Archive"}
                                    </p>
                                </div>
                            </div>

                            {!selectedExercise && (
                                <div className="flex bg-muted rounded-2xl p-1 p-1">
                                    {(['all', 'tonnage', 'cardio'] as const).map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab
                                                ? 'bg-card text-foreground shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={onClose}
                                className="absolute right-8 top-8 md:relative md:right-0 md:top-0 w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 md:p-12">
                            {prs.length === 0 ? (
                                <div className="text-center py-24">
                                    <Award className="w-24 h-24 text-muted/10 mx-auto mb-8" />
                                    <p className="text-muted-foreground font-serif italic text-2xl">No biological breakthroughs recorded yet.</p>
                                </div>
                            ) : selectedExercise ? (
                                /* DRILL-DOWN VIEW */
                                <div className="max-w-3xl mx-auto space-y-8">
                                    {groupedData[selectedExercise].map((record, idx) => (
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            key={record.id}
                                            className="flex items-center gap-8 group"
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${idx === 0 ? (record.pr_type === 'Weight' ? 'bg-[#ff4d4d] animate-pulse' : 'bg-[#4d94ff] animate-pulse') : 'bg-border'}`} />
                                                {idx !== groupedData[selectedExercise].length - 1 && (
                                                    <div className="w-px h-16 bg-border" />
                                                )}
                                            </div>
                                            <div className="flex-1 bg-muted/20 border border-border/50 rounded-3xl p-6 flex justify-between items-center group-hover:border-primary/30 transition-all duration-500">
                                                <div>
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                        <Calendar size={12} />
                                                        {new Date(record.created_at).toLocaleDateString(undefined, {
                                                            month: 'long',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </div>
                                                    <div className="text-3xl font-serif italic text-foreground mt-1">
                                                        {formatValue(record.value, record.unit, record.pr_type)}
                                                    </div>
                                                </div>
                                                {idx > 0 && (
                                                    <div className="text-right">
                                                        <div className="flex items-center gap-1 text-green-500 font-bold text-sm">
                                                            <TrendingUp size={14} />
                                                            {(() => {
                                                                const prev = groupedData[selectedExercise][idx + 1];
                                                                if (!prev) return "";
                                                                const diff = record.value - prev.value;
                                                                if (record.unit === 'sec') {
                                                                    // For time/pace, lower is better
                                                                    const timeDiff = prev.value - record.value;
                                                                    return `-${Math.round(timeDiff)}s faster`;
                                                                }
                                                                return `+${Math.round(diff)} ${getUnitLabel(units, 'weight')}`;
                                                            })()}
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">vs Previous PR</p>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                /* SUMMARY LIST VIEW */
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {filteredExercises.length === 0 ? (
                                        <div className="col-span-full text-center py-20 bg-muted/10 rounded-[32px] border border-dashed border-border">
                                            <p className="text-muted-foreground font-serif italic">No records found for this category.</p>
                                        </div>
                                    ) : (
                                        filteredExercises.map((name, idx) => {
                                            const latest = groupedData[name][0];
                                            const historyCount = groupedData[name].length;
                                            const isStrength = latest.pr_type === 'Weight';
                                            const themeColor = isStrength ? 'text-[#ff4d4d]' : 'text-[#4d94ff]';
                                            const bgColor = isStrength ? 'hover:bg-red-500/5' : 'hover:bg-blue-500/5';
                                            const borderColor = isStrength ? 'hover:border-red-500/30' : 'hover:border-blue-500/30';
                                            const glowColor = isStrength ? 'shadow-red-500/10' : 'shadow-blue-500/10';

                                            return (
                                                <motion.button
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    key={name}
                                                    onClick={() => setSelectedExercise(name)}
                                                    className={`p-10 bg-card border border-border rounded-[40px] ${bgColor} ${borderColor} hover:shadow-2xl ${glowColor} transition-all duration-700 group text-left relative overflow-hidden flex flex-col justify-between min-h-[280px]`}
                                                >
                                                    {/* Background Decorative Icon */}
                                                    <div className="absolute top-0 right-0 p-10 transform translate-x-8 -translate-y-8 opacity-[0.03] group-hover:translate-x-2 group-hover:translate-y-2 group-hover:opacity-[0.08] transition-all duration-[1500ms] ease-out">
                                                        <Award size={200} />
                                                    </div>

                                                    <div className="relative z-10 flex flex-col h-full gap-8">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex flex-col gap-1">
                                                                <span className={`text-[10px] font-black ${themeColor} uppercase tracking-[0.3em] ml-0.5`}>
                                                                    {latest.pr_type === 'Weight' ? 'Strength' : 'Distance'}
                                                                </span>
                                                                <h3 className="text-4xl font-serif text-foreground leading-none tracking-tight">
                                                                    {name}
                                                                </h3>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-2">
                                                                <div className="w-12 h-12 rounded-2xl bg-[#FFD700]/10 flex items-center justify-center text-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.2)] group-hover:scale-110 transition-transform duration-500">
                                                                    <Award size={24} fill="currentColor" fillOpacity={0.2} />
                                                                </div>
                                                                {historyCount > 1 && (
                                                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-full text-[9px] font-bold text-muted-foreground tracking-widest uppercase">
                                                                        <History size={10} />
                                                                        {historyCount}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="mt-auto">
                                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 opacity-50">Current Peak</p>
                                                            <div className="flex items-baseline gap-4">
                                                                <div className="text-5xl font-serif italic text-foreground tracking-tighter">
                                                                    {formatValue(latest.value, latest.unit, latest.pr_type)}
                                                                </div>
                                                                <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground uppercase tracking-widest pb-1 opacity-70">
                                                                    <Calendar size={12} className="opacity-50" />
                                                                    {new Date(latest.created_at).toLocaleDateString(undefined, {
                                                                        month: 'short',
                                                                        day: 'numeric'
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Interactive Arrow Indicator */}
                                                    <div className={`absolute bottom-8 right-8 w-12 h-12 rounded-full border border-border flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all duration-500 hover:bg-foreground hover:text-background`}>
                                                        <ChevronRight size={20} />
                                                    </div>
                                                </motion.button>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-8 border-t border-border bg-muted/10 text-center">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.5em] font-medium">
                                Biological capacity verified via neural telemetry // Hall of Power v3.1
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

