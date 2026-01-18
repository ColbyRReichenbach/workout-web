"use client";

import { motion } from "framer-motion";
import { CheckCircle, HeartPulse, ArrowRight, Zap, Target, Activity, Flower2, Footprints, Moon } from "lucide-react";
import { LogStrengthSets, LogCardioBasic, LogMetcon } from "@/components/LogInput";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { ProgramData, WorkoutSegment } from "@/lib/types";

import { PostFlightModal } from "@/components/FlightModals";
import PrCelebration from "@/components/PrCelebration";
import { TiltCard } from "@/components/TiltCard";

// Helper for type-based styling
const getSegmentIcon = (type: string, name: string = "", dayName: string = "", phase: number = 1) => {
    const lower = name.toLowerCase();
    const lowerDay = dayName.toLowerCase();

    // Global Overrides
    if (lowerDay === 'sunday' || lower.includes('rest')) return Moon;

    // Semantic Keyword Detection
    if (lower.includes('run') || lower.includes('sprint') || lower.includes('jog') || lower.includes('tempo') || lower.includes('ruck')) return Footprints;
    if (lower.includes('yoga') || lower.includes('stretch') || lower.includes('mobility') || lower.includes('flow')) return Flower2;
    if (lower.includes('rest') || lower.includes('sleep') || lower.includes('recovery day')) return Moon;

    // Fallback to Protocol Type
    switch (type) {
        case 'MAIN_LIFT': return Zap;
        case 'ACCESSORY': return Activity;
        case 'CARDIO': return HeartPulse;
        case 'REST': return Moon;
        default: return Target;
    }
};

// Animation Variants
const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

// Day name mapping
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function WorkoutPage() {
    const [loading, setLoading] = useState(true);
    const [todaysWorkout, setTodaysWorkout] = useState<ProgramData['phases'][0]['weeks'][0]['days'][0] | null>(null);
    const [segments, setSegments] = useState<WorkoutSegment[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [actualDayName, setActualDayName] = useState("");

    // Flight State
    const [showPostFlight, setShowPostFlight] = useState(false);
    const [sessionData, setSessionData] = useState<any>({});

    // PR State
    const [prCelebration, setPrCelebration] = useState<{ show: boolean, value: number, unit: string }>({ show: false, value: 0, unit: '' });

    useEffect(() => {
        async function fetchData() {
            const supabase = createClient();
            const searchParams = new URLSearchParams(window.location.search);
            const targetDay = searchParams.get('day');

            const { data: profileData } = await supabase.from('profiles').select('*').single();
            setProfile(profileData);

            let workoutDayIndex;
            if (targetDay) {
                workoutDayIndex = dayNames.indexOf(targetDay);
                if (workoutDayIndex === -1) workoutDayIndex = 0;
                setActualDayName(targetDay);
            } else {
                const jsDay = new Date().getDay();
                setActualDayName(dayNames[jsDay]);
                workoutDayIndex = jsDay === 0 ? 6 : jsDay - 1;
            }

            const { data: library } = await supabase.from('workout_library').select('program_data').single();

            if (library && library.program_data?.phases) {
                const phases = library.program_data.phases;
                const absWeek = profileData?.current_week || 1;
                const phaseIdx = (profileData?.current_phase || 1) - 1;

                const phase = phases[phaseIdx] || phases[0];

                // Map absolute week to available relative week templates (usually 1-4)
                const relativeWeekIdx = (absWeek - 1) % (phase.weeks?.length || 4);
                const week = phase.weeks[relativeWeekIdx] || phase.weeks[0];
                const todayData = week.days[workoutDayIndex] || week.days[0];

                setTodaysWorkout(todayData);
                setSegments(todayData.segments || []);
            }
            setLoading(false);
        }
        fetchData();
    }, []);

    const handleFinishWorkout = async (data: any) => {
        const fullSession = { ...sessionData, ...data };
        const supabase = createClient();
        const { error } = await supabase.from('session_logs').insert({
            session_rpe: fullSession.rpe,
            notes: fullSession.notes,
            tags: fullSession.tags
        });

        if (error) console.error("Failed to save session log:", error);
        window.location.href = "/";
    };

    const calcWeight = (segmentName: string, percent: number) => {
        if (!profile) return 0;
        const name = segmentName.toLowerCase();
        let base = profile.squat_max || 0;
        if (name.includes('bench') || name.includes('press')) base = profile.bench_max || 0;
        else if (name.includes('deadlift') || name.includes('rdl')) base = profile.deadlift_max || 0;
        return Math.round((base * percent) / 5) * 5;
    };

    const estimate1RM = (weight: number, reps: number) => Math.round(weight / (1.0278 - (0.0278 * reps)));

    const checkPr = async (segmentName: string, weight: number, reps: number) => {
        if (!profile) return;
        const name = segmentName.toLowerCase();
        let type: 'squat_max' | 'deadlift_max' | 'bench_max' | null = null;

        if (name.includes('squat')) type = 'squat_max';
        else if (name.includes('deadlift') || name.includes('rdl')) type = 'deadlift_max';
        else if (name.includes('bench')) type = 'bench_max';

        if (type && weight > 0 && reps > 0) {
            const estimatedMax = estimate1RM(weight, reps);
            if (estimatedMax > (profile[type] || 0)) {
                setPrCelebration({ show: true, value: estimatedMax, unit: 'lb' });
                const supabase = createClient();
                await supabase.from('pr_history').insert({ exercise_name: segmentName, value: estimatedMax, unit: 'lb', pr_type: '1RM (Est)' });
            }
        }
    };

    const logSegment = async (segment: WorkoutSegment, idx: number, data: any) => {
        const el = document.getElementById(`status-${idx}`);
        if (el) el.classList.remove('hidden');

        // Check for PRs in sets or individual weight/reps
        if (data.sets && Array.isArray(data.sets)) {
            // Find best set (highest weight) to check for PR
            const bestSet = data.sets.reduce((prev: any, current: any) =>
                ((current.weight || 0) > (prev.weight || 0)) ? current : prev
                , data.sets[0]);
            if (bestSet.weight && bestSet.reps) await checkPr(segment.name, bestSet.weight, bestSet.reps);
        } else if (data.weight && data.reps) {
            await checkPr(segment.name, data.weight, data.reps);
        }

        const supabase = createClient();
        await supabase.from('logs').insert({
            segment_name: segment.name,
            segment_type: segment.type,
            tracking_mode: segment.tracking_mode,
            performance_data: data,
            phase_id: profile?.current_phase || 1,
            week_number: profile?.current_week || 1,
            day_name: actualDayName
        });
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center text-stone-400 font-serif animate-pulse text-xl">
                Preparing Pulse Environment...
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-16 pb-32">
            <PostFlightModal isOpen={showPostFlight} onClose={() => setShowPostFlight(false)} onFinish={handleFinishWorkout} />

            <PrCelebration
                show={prCelebration.show}
                value={prCelebration.value}
                unit={prCelebration.unit}
                onComplete={() => setPrCelebration({ ...prCelebration, show: false })}
            />

            <motion.div variants={container} initial="hidden" animate="show" className="space-y-12">
                {/* Header */}
                <header className="space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                        <HeartPulse size={16} className="animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-60">Live Pulse Session</span>
                    </div>
                    <h1 className="font-serif text-6xl md:text-8xl text-stone-900 leading-[0.85] tracking-tight">{todaysWorkout?.title}</h1>
                    <p className="text-stone-500 text-xl font-light italic max-w-2xl">
                        Calibrate your output. Maintain the protocol's intensity spectrum.
                    </p>
                </header>

                {/* Workout Cards */}
                <div className="space-y-8">
                    {segments.map((segment, idx) => {
                        const Icon = getSegmentIcon(segment.type, segment.name, actualDayName, profile?.current_phase);
                        return (
                            <TiltCard
                                key={idx}
                                glowColor={segment.type === 'MAIN_LIFT' ? "shadow-primary/10" : "shadow-stone-900/5"}
                                className="group rounded-[48px] p-10 overflow-hidden"
                            >
                                {/* Background Icon Watermark */}
                                <div className={`absolute -right-12 -bottom-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-300 pointer-events-none ${segment.type === 'MAIN_LIFT' ? 'text-primary' : 'text-stone-300'}`} style={{ willChange: 'opacity' }}>
                                    <Icon size={180} strokeWidth={1} />
                                </div>

                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-10 relative z-10">
                                    <div className="flex-1 space-y-8">
                                        <div className="flex items-center gap-4">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${segment.type === 'MAIN_LIFT' ? 'bg-primary/5 text-primary' : 'bg-stone-100 text-stone-400'
                                                }`}>
                                                {segment.type}
                                            </span>
                                            <h2 className="font-serif text-4xl text-stone-900 tracking-tight italic">
                                                {segment.name}
                                            </h2>
                                            <span id={`status-${idx}`} className="text-emerald-500 hidden drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                                <CheckCircle size={32} />
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-5">
                                                {segment.target?.sets && (
                                                    <div className="flex items-center gap-4 text-stone-900">
                                                        <div className="w-12 h-12 rounded-2xl bg-stone-50 border border-black/[0.03] flex items-center justify-center text-stone-300 transition-transform duration-200 group-hover:scale-105">
                                                            <Target size={20} />
                                                        </div>
                                                        <span className="font-serif text-3xl italic tracking-tight">
                                                            {segment.target.sets} <span className="text-stone-400 font-sans text-sm not-italic uppercase tracking-widest font-bold mx-1">sets of</span> {segment.target.reps}
                                                        </span>
                                                    </div>
                                                )}
                                                {segment.target?.percent_1rm && (
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary transition-transform duration-200 group-hover:scale-105">
                                                            <Zap size={20} />
                                                        </div>
                                                        <span className="text-stone-500 text-xl font-light">
                                                            Load: <span className="font-serif text-3xl text-stone-900 italic tracking-tight">{calcWeight(segment.name, segment.target.percent_1rm)}lb</span>
                                                            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/40 ml-4">@{segment.target.percent_1rm * 100}%</span>
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {segment.details && (
                                                <div className="bg-stone-50/70 rounded-[32px] p-6 border border-black/[0.02] transition-colors duration-200 group-hover:bg-white/70">
                                                    <p className="text-stone-400 text-sm leading-relaxed italic">
                                                        "{segment.details}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="w-full md:w-auto flex items-center justify-end">
                                        {segment.tracking_mode === 'CHECKBOX' && (
                                            <button
                                                onClick={() => logSegment(segment, idx, { completed: true })}
                                                className="h-24 w-24 rounded-[32px] bg-primary/5 border border-primary/10 flex items-center justify-center hover:bg-primary hover:text-white transition-colors duration-200 btn-pro hover:shadow-primary/30 group/btn"
                                            >
                                                <CheckCircle size={36} className="transition-transform group-hover/btn:scale-110 group-hover/btn:rotate-6" />
                                            </button>
                                        )}
                                        {segment.tracking_mode === 'STRENGTH_SETS' && <LogStrengthSets segment={segment} idx={idx} onLog={logSegment} />}
                                        {segment.tracking_mode === 'METCON' && <LogMetcon segment={segment} idx={idx} onLog={logSegment} />}
                                        {segment.tracking_mode === 'CARDIO_BASIC' && <LogCardioBasic segment={segment} idx={idx} onLog={logSegment} />}
                                    </div>
                                </div>
                            </TiltCard>
                        );
                    })}
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowPostFlight(true)}
                    className="w-full py-10 rounded-[48px] bg-stone-900 text-white text-3xl font-serif italic flex items-center justify-center gap-6 shadow-2xl transition-all btn-pro hover:bg-primary hover:shadow-primary/30"
                >
                    Complete Pulse Sequence <ArrowRight size={28} />
                </motion.button>
            </motion.div>
        </div>
    );
}
