"use client";

import { motion } from "framer-motion";
import { CheckCircle, HeartPulse, ArrowRight, Zap, Target, Activity, Flower2, Footprints, Moon } from "lucide-react";
import { LogStrengthSets, LogCardioBasic, LogMetcon } from "@/components/LogInput";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { ProgramData, WorkoutSegment, UserProfile } from "@/lib/types";

import { PostFlightModal, PostFlightData } from "@/components/FlightModals";
import PrCelebration from "@/components/PrCelebration";
import { TiltCard } from "@/components/TiltCard";
import { useSettings } from "@/context/SettingsContext";
import { getUnitLabel, toDisplayWeight } from "@/lib/conversions";

// Helper for type-based styling
const getSegmentIcon = (type: string, name: string = "", dayName: string = "") => {
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

// Day name mapping (Monday-indexed to match workout_library)
const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function WorkoutPage() {
    const [loading, setLoading] = useState(true);
    const [todaysWorkout, setTodaysWorkout] = useState<ProgramData['phases'][0]['weeks'][0]['days'][0] | null>(null);
    const [segments, setSegments] = useState<WorkoutSegment[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [actualDayName, setActualDayName] = useState("");
    const { units } = useSettings();

    // Flight State
    const [showPostFlight, setShowPostFlight] = useState(false);

    // Logged segments tracking (indices of segments already logged)
    const [loggedSegments, setLoggedSegments] = useState<Set<number>>(new Set());

    // PR State
    const [prCelebration, setPrCelebration] = useState<{ show: boolean, value: number, unit: string }>({ show: false, value: 0, unit: '' });

    useEffect(() => {
        async function fetchData() {
            const supabase = createClient();
            const searchParams = new URLSearchParams(window.location.search);
            const targetDay = searchParams.get('day');

            const { data: { user }, error: authError } = await supabase.auth.getUser();

            // Determine which profile to fetch
            const isGuestMode = !user || authError;
            const profileId = isGuestMode ? '00000000-0000-0000-0000-000000000001' : user.id;

            console.log("[Workout] Auth mode:", isGuestMode ? "GUEST" : "AUTHENTICATED", "Profile ID:", profileId);

            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', profileId)
                .single();

            if (profileError) {
                console.error("[Workout] Profile fetch error:", profileError);
            }
            console.log("[Workout] Loaded profile:", profileData?.id, "with max lifts:", {
                squat: profileData?.squat_max,
                bench: profileData?.bench_max,
                deadlift: profileData?.deadlift_max
            });

            setProfile(profileData);

            let workoutDayIndex;
            if (targetDay) {
                workoutDayIndex = dayNames.indexOf(targetDay);
                if (workoutDayIndex === -1) workoutDayIndex = 0;
                setActualDayName(targetDay);
            } else {
                const jsDay = new Date().getDay();
                // Convert JS day (0=Sun) to library index (0=Mon)
                const libraryDayIndex = jsDay === 0 ? 6 : jsDay - 1;
                setActualDayName(dayNames[libraryDayIndex]);
                workoutDayIndex = libraryDayIndex;
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

                // Fetch existing logs for today's workout to prevent duplicate submissions
                const todayDayName = targetDay || dayNames[workoutDayIndex];
                const { data: existingLogs } = await supabase
                    .from('logs')
                    .select('segment_name')
                    .eq('user_id', profileId)
                    .eq('week_number', absWeek)
                    .eq('day_name', todayDayName);

                if (existingLogs && existingLogs.length > 0) {
                    // Map existing logs to segment indices
                    const segmentNames = todayData.segments?.map((s: { name: string }) => s.name) || [];
                    const alreadyLogged = new Set<number>();

                    existingLogs.forEach(log => {
                        const idx = segmentNames.indexOf(log.segment_name);
                        if (idx !== -1) {
                            alreadyLogged.add(idx);
                        }
                    });

                    console.log("[Workout] Found existing logs for segments:", [...alreadyLogged]);
                    setLoggedSegments(alreadyLogged);
                }
            }
            setLoading(false);
        }
        fetchData();
    }, []);

    const handleFinishWorkout = async (data: PostFlightData) => {
        const fullSession = { ...data };
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
        if (!profile) {
            console.warn("[calcWeight] No profile loaded");
            return 0;
        }
        const name = segmentName.toLowerCase();

        // Parse string maxes to numbers with explicit logging
        const squatMax = parseInt(String(profile.squat_max)) || 0;
        const benchMax = parseInt(String(profile.bench_max)) || 0;
        const deadliftMax = parseInt(String(profile.deadlift_max)) || 0;

        console.log("[calcWeight] Profile maxes:", { squatMax, benchMax, deadliftMax, profileId: profile.id });

        // Determine which max to use based on exercise name
        let base = squatMax; // default to squat
        let liftType = "squat";

        if (name.includes('bench')) {
            base = benchMax;
            liftType = "bench";
        } else if (name.includes('overhead') || name.includes('ohp')) {
            // Overhead press typically uses bench correlation or own max
            base = benchMax;
            liftType = "ohp (from bench)";
        } else if (name.includes('deadlift') || name.includes('rdl') || name.includes('romanian')) {
            base = deadliftMax;
            liftType = "deadlift";
        } else if (name.includes('squat') || name.includes('front squat') || name.includes('back squat')) {
            base = squatMax;
            liftType = "squat";
        }

        console.log(`[calcWeight] ${segmentName} -> ${liftType} @ ${base} * ${percent} = ${base * percent}`);

        const targetLbs = base * percent;

        if (units === 'metric') {
            const targetKg = targetLbs * 0.453592;
            return Math.round(targetKg / 2.5) * 2.5;
        }
        return Math.round(targetLbs / 5) * 5;
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
                // estimatedMax is in LBS. Convert to user units for display.
                const displayVal = toDisplayWeight(estimatedMax, units);
                const displayUnit = getUnitLabel(units, 'weight');

                setPrCelebration({ show: true, value: Number(displayVal), unit: displayUnit });
                const supabase = createClient();
                await supabase.from('pr_history').insert({
                    user_id: profile.id,
                    exercise_name: segmentName,
                    value: estimatedMax,
                    unit: 'lb',
                    pr_type: '1RM (Est)'
                });
            }
        }
    };

    const logSegment = async (segment: WorkoutSegment, idx: number, data: Record<string, unknown>) => {
        const el = document.getElementById(`status-${idx}`);
        if (el) el.classList.remove('hidden');

        // Check for PRs in sets or individual weight/reps
        if (data.sets && Array.isArray(data.sets) && data.sets.length > 0) {
            // Find best set (highest weight) to check for PR
            const sets = data.sets as Record<string, number | undefined>[];
            const bestSet = sets.reduce((prev, current) => {
                const prevWeight = prev.weight || 0;
                const currWeight = current.weight || 0;
                return currWeight > prevWeight ? current : prev;
            }, sets[0]);

            if (bestSet && bestSet.weight && bestSet.reps) {
                await checkPr(segment.name, bestSet.weight, bestSet.reps);
            }
        } else if (data.weight && typeof data.weight === 'number' && data.reps && typeof data.reps === 'number') {
            await checkPr(segment.name, data.weight, data.reps);
        }

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const currentUserId = user?.id || '00000000-0000-0000-0000-000000000001';

        // Delete any existing log for this segment (to allow upsert/overwrite)
        await supabase.from('logs')
            .delete()
            .eq('user_id', currentUserId)
            .eq('segment_name', segment.name)
            .eq('week_number', profile?.current_week || 1)
            .eq('day_name', actualDayName);

        // Insert new log data
        await supabase.from('logs').insert({
            user_id: currentUserId,
            segment_name: segment.name,
            segment_type: segment.type,
            tracking_mode: segment.tracking_mode,
            performance_data: data,
            phase_id: profile?.current_phase || 1,
            week_number: profile?.current_week || 1,
            day_name: actualDayName
        });

        // Track that this segment was logged
        setLoggedSegments(prev => new Set([...prev, idx]));
    };

    // Enable edit mode: just show the form again without deleting the log
    // When the user re-submits, logSegment will upsert (delete + insert)
    const enableEditMode = (idx: number) => {
        setLoggedSegments(prev => {
            const updated = new Set([...prev]);
            updated.delete(idx);
            return updated;
        });
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center text-muted-foreground font-serif animate-pulse text-xl">
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
                    <h1 className="font-serif text-6xl md:text-8xl text-foreground leading-[0.85] tracking-tight">{todaysWorkout?.title}</h1>
                    <p className="text-muted-foreground text-xl font-light italic max-w-2xl">
                        Calibrate your output. Maintain the protocol&apos;s intensity spectrum.
                    </p>
                </header>

                {/* Workout Cards */}
                <div className="space-y-8">
                    {segments.map((segment, idx) => {
                        const Icon = getSegmentIcon(segment.type, segment.name, actualDayName);
                        return (
                            <TiltCard
                                key={idx}
                                glowColor={segment.type === 'MAIN_LIFT' ? "shadow-primary/10" : "shadow-muted-foreground/5"}
                                className="group rounded-[48px] p-10 overflow-hidden"
                            >
                                {/* Background Icon Watermark */}
                                <div className={`absolute -right-12 -bottom-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-300 pointer-events-none ${segment.type === 'MAIN_LIFT' ? 'text-primary' : 'text-muted-foreground'}`} style={{ willChange: 'opacity' }}>
                                    <Icon size={180} strokeWidth={1} />
                                </div>

                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-10 relative z-10">
                                    <div className="flex-1 space-y-8">
                                        <div className="flex items-center gap-4">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${segment.type === 'MAIN_LIFT' ? 'bg-primary/5 text-primary' : 'bg-muted text-muted-foreground'
                                                }`}>
                                                {segment.type.replace('_', ' ')}
                                            </span>
                                            <h2 className="font-serif text-4xl text-foreground tracking-tight italic">
                                                {segment.name}
                                            </h2>
                                            <span id={`status-${idx}`} className="text-emerald-500 hidden drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                                <CheckCircle size={32} />
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-5">
                                                {segment.target?.sets && (
                                                    <div className="flex items-center gap-4 text-foreground">
                                                        <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground transition-transform duration-200 group-hover:scale-105">
                                                            <Target size={20} />
                                                        </div>
                                                        <span className="font-serif text-3xl italic tracking-tight">
                                                            {segment.target.sets} <span className="text-muted-foreground font-sans text-sm not-italic uppercase tracking-widest font-bold mx-1">sets of</span> {segment.target.reps}
                                                        </span>
                                                    </div>
                                                )}
                                                {segment.target?.percent_1rm && (
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary transition-transform duration-200 group-hover:scale-105">
                                                            <Zap size={20} />
                                                        </div>
                                                        <span className="text-muted-foreground text-xl font-light">
                                                            Load: <span className="font-serif text-3xl text-foreground italic tracking-tight">{calcWeight(segment.name, segment.target.percent_1rm)}{getUnitLabel(units, 'weight')}</span>
                                                            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/40 ml-4">@{segment.target.percent_1rm * 100}%</span>
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {segment.details && (
                                                <div className="bg-muted/30 rounded-[32px] p-6 border border-border transition-colors duration-200 group-hover:bg-muted/50">
                                                    <p className="text-muted-foreground text-sm leading-relaxed italic">
                                                        &quot;{segment.details}&quot;
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="w-full md:w-auto flex items-center justify-end">
                                        {loggedSegments.has(idx) ? (
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl px-6 py-4">
                                                    <CheckCircle className="text-emerald-500" size={20} />
                                                    <span className="text-emerald-600 font-bold text-xs uppercase tracking-widest">Synchronized</span>
                                                </div>
                                                <button
                                                    onClick={() => enableEditMode(idx)}
                                                    className="text-xs text-muted-foreground hover:text-primary underline transition-colors"
                                                >
                                                    Edit Entry
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                {segment.tracking_mode === 'CHECKBOX' && (
                                                    <button
                                                        onClick={() => logSegment(segment, idx, { completed: true })}
                                                        className="h-24 w-24 rounded-[32px] bg-primary/5 border border-primary/10 flex items-center justify-center hover:bg-primary hover:text-white transition-colors duration-200 btn-pro hover:shadow-primary/30 group/btn"
                                                    >
                                                        <CheckCircle size={36} className="transition-transform group-hover/btn:scale-110 group-hover/btn:rotate-6" />
                                                    </button>
                                                )}
                                                {segment.tracking_mode === 'STRENGTH_SETS' && <LogStrengthSets segment={segment} idx={idx} onLog={logSegment} calculatedWeight={segment.target?.percent_1rm ? calcWeight(segment.name, segment.target.percent_1rm) : undefined} />}
                                                {segment.tracking_mode === 'METCON' && <LogMetcon segment={segment} idx={idx} onLog={logSegment} />}
                                                {segment.tracking_mode === 'CARDIO_BASIC' && <LogCardioBasic segment={segment} idx={idx} onLog={logSegment} />}
                                            </>
                                        )}
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
                    className="w-full py-10 rounded-[48px] bg-foreground text-background text-3xl font-serif italic flex items-center justify-center gap-6 shadow-2xl transition-all btn-pro hover:bg-primary hover:text-primary-foreground hover:shadow-primary/30"
                >
                    Complete Pulse Sequence <ArrowRight size={28} />
                </motion.button>
            </motion.div>
        </div>
    );
}
