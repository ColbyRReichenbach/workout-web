/**
 * PRHistory Component
 * 
 * Displays the user's personal record history from the 'pr_history' table.
 */

"use client";

import { Award, Calendar, ChevronRight } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { toDisplayWeight, getUnitLabel } from "@/lib/conversions";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";

interface PRRecord {
    id: string;
    exercise_name: string;
    value: number;
    unit: string;
    pr_type: string;
    created_at: string;
}

interface PRHistoryProps {
    prs: PRRecord[];
    viewMode: 'tonnage' | 'cardio';
    onOpenSpectrum?: (prs: PRRecord[]) => void;
}

export function PRHistory({ prs, viewMode, onOpenSpectrum }: PRHistoryProps) {
    const { units } = useSettings();

    // Filter based on viewMode
    const filteredPrs = prs.filter(pr =>
        viewMode === 'cardio'
            ? ['Distance', 'Time', 'Pace', 'Pwr'].includes(pr.pr_type)
            : pr.pr_type === 'Weight'
    );

    // Color definitions
    const isStrength = viewMode === 'tonnage';
    const themeColor = isStrength ? 'text-[#ff4d4d]' : 'text-[#4d94ff]';
    const accentColor = isStrength ? 'bg-[#ff4d4d]/10' : 'bg-[#4d94ff]/10';

    if (filteredPrs.length === 0 && viewMode === 'cardio') {
        return (
            <Card variant="outline" className="text-center p-12 border-dashed h-full flex flex-col items-center justify-center">
                < Award className="w-12 h-12 text-blue-500/20 mx-auto mb-4" />
                <p className="text-muted-foreground font-serif italic">No aerobic benchmarks yet.</p>
                <button
                    onClick={() => onOpenSpectrum?.(prs)}
                    className="mt-6 text-[10px] font-bold text-[#4d94ff] uppercase tracking-widest hover:underline"
                >
                    View All records
                </button>
            </Card>
        );
    }

    if (prs.length === 0) {
        return (
            <Card variant="outline" className="text-center p-12 border-dashed h-full flex flex-col items-center justify-center">
                < Award className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground font-serif italic">No benchmarks synchronized.</p>
            </Card>
        );
    }

    // The Hero PR is the latest one of the current type
    const latestPr = filteredPrs[0] || prs[0];
    return (
        <Card variant="elevated" className={`h-full group hover:border-${isStrength ? 'red' : 'blue'}-500/50 transition-all duration-500 overflow-hidden relative border-border/50`}>
            <div className={`absolute -right-8 -top-8 ${themeColor} opacity-[0.03] -rotate-12 group-hover:scale-110 group-hover:opacity-[0.08] transition-all duration-700`}>
                <Award size={200} strokeWidth={0.5} />
            </div>

            <CardHeader className="relative z-10 pb-0">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle size="md">Latest Breakthrough</CardTitle>
                        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1">Hall of Power</p>
                    </div>
                    <div className={`w-12 h-12 rounded-2xl ${accentColor} flex items-center justify-center ${themeColor} shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                        <Award size={24} fill="currentColor" fillOpacity={0.2} />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="relative z-10 pt-10">
                <div className="space-y-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black ${themeColor} uppercase tracking-[0.3em]`}>{latestPr.pr_type === 'Weight' ? 'Strength' : 'Distance'}</span>
                        </div>
                        <h4 className="font-serif text-3xl text-foreground leading-tight tracking-tight">{latestPr.exercise_name}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-medium tracking-widest opacity-60">
                            <Calendar size={12} className="opacity-50" />
                            {new Date(latestPr.created_at).toLocaleDateString(undefined, {
                                month: 'long',
                                day: 'numeric'
                            })}
                        </div>
                    </div>

                    <div className="flex justify-between items-end border-b border-border pb-8">
                        <div className="space-y-1">
                            <div className="font-serif text-6xl italic text-foreground tracking-tighter leading-none">
                                {latestPr.unit === 'sec' ? (
                                    (() => {
                                        const m = Math.floor(latestPr.value / 60);
                                        const s = Math.round(latestPr.value % 60);
                                        return `${m}:${s < 10 ? '0' : ''}${s}`;
                                    })()
                                ) : latestPr.unit === 'watts' ? (
                                    latestPr.value
                                ) : latestPr.pr_type === 'Distance' ? (
                                    latestPr.value.toFixed(2)
                                ) : (
                                    toDisplayWeight(latestPr.value, units)
                                )}
                                <span className="text-xl font-sans not-italic text-muted-foreground ml-3 lowercase opacity-50">
                                    {latestPr.unit === 'sec'
                                        ? (latestPr.pr_type === 'Pace' ? (units === 'metric' ? '/km' : '/mi') : '')
                                        : latestPr.unit === 'watts' ? 'w' :
                                            latestPr.pr_type === 'Distance' ? (units === 'metric' ? 'km' : 'mi') :
                                                getUnitLabel(units, 'weight')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => onOpenSpectrum?.(prs)}
                        className={`w-full py-5 rounded-[24px] bg-muted/50 hover:bg-foreground hover:text-background text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 group/btn shadow-sm`}
                    >
                        See Full Spectrum
                        <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                </div>
            </CardContent>
        </Card>
    );
}