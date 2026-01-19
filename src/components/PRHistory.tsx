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

export function PRHistory() {
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
            <Card variant="outline" className="text-center p-12 border-dashed">
                < Award className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground font-serif italic">No personal records synchronized yet.</p>
            </Card>
        );
    }

    // Group PRs by exercise to show best only or a limited list
    const latestPrs = prs.slice(0, 5);

    return (
        <Card variant="elevated" className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle size="md">Personal Records</CardTitle>
                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1">Hall of Power</p>
                </div>
                <Award className="text-primary" size={24} />
            </CardHeader>
            <CardContent className="space-y-4">
                {latestPrs.map((pr) => (
                    <div key={pr.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border group hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <TrendingUp size={18} />
                            </div>
                            <div>
                                <h4 className="font-serif text-lg leading-tight">{pr.exercise_name}</h4>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                                    <Calendar size={10} />
                                    {new Date(pr.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-serif text-2xl italic text-foreground leading-tight">
                                {toDisplayWeight(pr.value, units)}
                                <span className="text-xs font-sans not-italic text-muted-foreground ml-1">
                                    {getUnitLabel(units, 'weight')}
                                </span>
                            </div>
                            <span className="text-[9px] font-bold text-primary uppercase tracking-widest">{pr.pr_type}</span>
                        </div>
                    </div>
                ))}

                <button className="w-full py-4 mt-2 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors group">
                    View Full Spectrum <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </CardContent>
        </Card>
    );
}
