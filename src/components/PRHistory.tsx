/**
 * PRHistory Component
 * 
 * Displays the user's personal record history from the 'pr_history' table.
 */

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Award, TrendingUp, Calendar, ChevronRight } from "lucide-react";
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
    onOpenSpectrum?: (prs: PRRecord[]) => void;
}

export function PRHistory({ onOpenSpectrum }: PRHistoryProps) {
    const [prs, setPrs] = useState<PRRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const { units } = useSettings();

    useEffect(() => {
        async function fetchPRs() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || '00000000-0000-0000-0000-000000000001';

            const { data, error } = await supabase
                .from('pr_history')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Failed to fetch PR history:", error);
            } else {
                setPrs(data || []);
            }
            setLoading(false);
        }
        fetchPRs();
    }, []);

    if (loading) {
        return <div className="animate-pulse h-48 bg-muted/20 rounded-xl" />;
    }

    if (prs.length === 0) {
        return (
            <Card variant="outline" className="text-center p-12 border-dashed h-full flex flex-col items-center justify-center">
                < Award className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground font-serif italic">No benchmarks synchronized.</p>
            </Card>
        );
    }

    // The Hero PR is simply the latest one
    const latestPr = prs[0];

    return (
        <Card variant="elevated" className="h-full group hover:border-primary/50 transition-all duration-500 overflow-hidden relative">
            <div className="absolute -right-8 -top-8 text-primary/5 -rotate-12 group-hover:scale-110 transition-transform duration-700">
                <Award size={160} strokeWidth={0.5} />
            </div>

            <CardHeader className="relative z-10 pb-0">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle size="md">Latest Benchmark</CardTitle>
                        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1">Hall of Power</p>
                    </div>
                    <Award className="text-primary animate-pulse" size={24} />
                </div>
            </CardHeader>

            <CardContent className="relative z-10 pt-10">
                <div className="space-y-8">
                    <div className="space-y-2">
                        <h4 className="font-serif text-3xl text-foreground leading-tight tracking-tight">{latestPr.exercise_name}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                            <Calendar size={12} />
                            {new Date(latestPr.created_at).toLocaleDateString()}
                        </div>
                    </div>

                    <div className="flex justify-between items-end border-b border-border pb-6">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{latestPr.pr_type}</span>
                            <div className="font-serif text-5xl italic text-foreground tracking-tighter leading-none">
                                {latestPr.unit === 'sec' ? (
                                    (() => {
                                        const m = Math.floor(latestPr.value / 60);
                                        const s = Math.round(latestPr.value % 60);
                                        return `${m}:${s < 10 ? '0' : ''}${s}`;
                                    })()
                                ) : latestPr.unit === 'watts' ? (
                                    latestPr.value
                                ) : (
                                    toDisplayWeight(latestPr.value, units)
                                )}
                                <span className="text-lg font-sans not-italic text-muted-foreground ml-2 lowercase">
                                    {latestPr.unit === 'sec' ? '' : latestPr.unit === 'watts' ? 'w' : getUnitLabel(units, 'weight')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => onOpenSpectrum?.(prs)}
                        className="w-full py-5 rounded-[24px] bg-muted/50 hover:bg-muted text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 group/btn"
                    >
                        See Full Spectrum
                        <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                </div>
            </CardContent>
        </Card>
    );
}
