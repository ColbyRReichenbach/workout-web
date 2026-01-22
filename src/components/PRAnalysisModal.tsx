"use client";

import { X, Award, Calendar, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toDisplayWeight, getUnitLabel } from "@/lib/conversions";
import { useSettings } from "@/context/SettingsContext";

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

    // Group PRs by exercise and keep only the best/latest for each
    const groupedPrs = prs.reduce((acc, pr) => {
        if (!acc[pr.exercise_name] || new Date(pr.created_at) > new Date(acc[pr.exercise_name].created_at)) {
            acc[pr.exercise_name] = pr;
        }
        return acc;
    }, {} as Record<string, PRRecord>);

    const prList = Object.values(groupedPrs).sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-background/80 backdrop-blur-xl"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-2xl bg-card border border-border rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="p-8 md:p-12 border-b border-border flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <Award className="text-primary" size={24} />
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Full Spectrum Archive</span>
                                </div>
                                <h2 className="text-4xl font-serif text-foreground tracking-tight">Hall of Power</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-grow overflow-y-auto p-8 md:p-12 space-y-6">
                            {prList.length === 0 ? (
                                <div className="text-center py-20">
                                    <Award className="w-20 h-20 text-muted/20 mx-auto mb-6" />
                                    <p className="text-muted-foreground font-serif italic text-xl">No benchmarks recorded in this cycle.</p>
                                </div>
                            ) : (
                                prList.map((pr) => (
                                    <div
                                        key={pr.id}
                                        className="flex items-center justify-between p-6 bg-muted/20 rounded-3xl border border-border/50 group hover:border-primary/30 transition-all duration-500"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                <TrendingUp size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-serif text-2xl text-foreground leading-tight">{pr.exercise_name}</h4>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                    <Calendar size={12} />
                                                    {new Date(pr.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-serif text-3xl italic text-foreground leading-tight">
                                                {pr.unit === 'sec' ? (
                                                    // Time Formatting
                                                    (() => {
                                                        const m = Math.floor(pr.value / 60);
                                                        const s = Math.round(pr.value % 60);
                                                        return `${m}:${s < 10 ? '0' : ''}${s}`;
                                                    })()
                                                ) : pr.unit === 'watts' ? (
                                                    pr.value
                                                ) : (
                                                    // Weight Formatting
                                                    toDisplayWeight(pr.value, units)
                                                )}
                                                <span className="text-sm font-sans not-italic text-muted-foreground ml-1 lowercase">
                                                    {pr.unit === 'sec' ? '' : pr.unit === 'watts' ? 'w' : getUnitLabel(units, 'weight')}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{pr.pr_type}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-8 border-t border-border bg-muted/10 text-center">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                                Biological capacity verified via neural telemetry
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
