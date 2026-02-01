"use client";

import { motion } from "framer-motion";
import { CheckCircle, HeartPulse, ArrowRight, Zap, Target, Activity, Flower2, Footprints, Moon } from "lucide-react";
import { LogStrengthSets, LogCardioBasic, LogMetcon } from "@/components/LogInput";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { WorkoutSegment, UserProfile } from "@/lib/types";

import { PostFlightModal, PostFlightData } from "@/components/FlightModals";
import PrCelebration from "@/components/PrCelebration";
import { TiltCard } from "@/components/TiltCard";
import { useSettings } from "@/context/SettingsContext";
import { getUnitLabel, toDisplayWeight } from "@/lib/conversions";
import { DEMO_USER_ID } from "@/lib/constants";


import { calculateWorkingSet } from "@/lib/calculations/percentages";
import { getCheckpointData } from "@/lib/checkpointTests";
import { generateCheckpointWorkout } from "@/lib/checkpointWorkouts";

// Helper to render dynamic details
const renderSegmentDetails = (segment: WorkoutSegment, profile: UserProfile | null) => {
    if (!segment.details) return null;

    const displayDetails = segment.details;
    // Paces are used within formatPacePerUnit calls above via tokens

    // ... (logic for tokens)

    if (!profile) return <p className="text-muted-foreground text-sm leading-relaxed italic">&quot;{segment.details}&quot;</p>;

    return (
        <div className="bg-muted/30 rounded-xl p-6 border border-border">
            <p className="text-muted-foreground text-sm leading-relaxed italic">&quot;{displayDetails}&quot;</p>
        </div>
    );
};

// ... inside component render loop:
// {renderSegmentDetails(segment, profile)}

// Helper for type-based styling
const getSegmentIcon = (type: string, name: string = "", dayName: string = "") => {
    const lower = name.toLowerCase();
    const lowerDay = dayName.toLowerCase();
    if (lowerDay === 'sunday' || lower.includes('rest')) return Moon;
    if (lower.includes('run') || lower.includes('sprint') || lower.includes('jog') || lower.includes('tempo') || lower.includes('ruck')) return Footprints;
    if (lower.includes('yoga') || lower.includes('stretch') || lower.includes('mobility') || lower.includes('flow')) return Flower2;
    if (lower.includes('rest') || lower.includes('sleep') || lower.includes('recovery day')) return Moon;
    switch (type) {
        case 'MAIN_LIFT': return Zap;
        case 'ACCESSORY': return Activity;
        case 'CARDIO': return HeartPulse;
        case 'REST': return Moon;
        default: return Target;
    }
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function WorkoutPage() {
    const [loading, setLoading] = useState(true);
    const [todaysWorkout, setTodaysWorkout] = useState<{ title: string; description?: string; segments: WorkoutSegment[] } | null>(null);
    const [segments, setSegments] = useState<WorkoutSegment[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [currentWeek, setCurrentWeek] = useState(1);
    const [currentPhase, setCurrentPhase] = useState(1);
    const [actualDayName, setActualDayName] = useState("");
    const { units } = useSettings();

    const [showPostFlight, setShowPostFlight] = useState(false);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [loggedSegments, setLoggedSegments] = useState<Set<number>>(new Set());
    const [prCelebration, setPrCelebration] = useState<{ show: boolean, value: number, unit: string }>({ show: false, value: 0, unit: '' });

    useEffect(() => {
        async function fetchData() {
            const supabase = createClient();
            const searchParams = new URLSearchParams(window.location.search);
            const targetDay = searchParams.get('day');
            const targetWeekParam = searchParams.get('week');

            const { data: { user }, error: authError } = await supabase.auth.getUser();
            const isGuestMode = !user || authError;
            const profileId = isGuestMode ? DEMO_USER_ID : user.id;

            const { data: profileData } = await supabase.from('profiles').select('*').eq('id', profileId).single();
            setProfile(profileData);

            let workoutDayIndex;
            if (targetDay) {
                workoutDayIndex = dayNames.indexOf(targetDay);
                if (workoutDayIndex === -1) workoutDayIndex = 0;
                setActualDayName(targetDay);
            } else {
                const jsDay = new Date().getDay();
                const libraryDayIndex = jsDay === 0 ? 6 : jsDay - 1;
                setActualDayName(dayNames[libraryDayIndex]);
                workoutDayIndex = libraryDayIndex;
            }

            const { data: library } = await supabase.from('workout_library').select('program_data').single();

            if (library && library.program_data?.phases) {
                const phases = library.program_data.phases;
                let absWeek = profileData?.current_week || 1;
                if (targetWeekParam) {
                    const parsed = parseInt(targetWeekParam);
                    if (!isNaN(parsed)) absWeek = parsed;
                }
                setCurrentWeek(absWeek);

                setCurrentWeek(absWeek);

                let phaseIdx = 0;
                let weekCount = 0;

                // Always calculate phase and offset based on absolute week
                for (let i = 0; i < phases.length; i++) {
                    const phaseLen = phases[i].weeks?.length || 4;
                    if (absWeek <= weekCount + phaseLen) {
                        phaseIdx = i;
                        break;
                    }
                    weekCount += phaseLen;
                }
                setCurrentPhase(phaseIdx + 1);

                const phase = phases[phaseIdx] || phases[0];
                // Correctly calculate relative index by subtracting potential previous weeks
                // weekCount holds the sum of weeks from all PREVIOUS phases at this point
                const relativeWeekIdx = (absWeek - 1) - weekCount;
                const week = phase.weeks[relativeWeekIdx] || phase.weeks[0];
                let todayData = week.days[workoutDayIndex] || week.days[0];
                const todayDayName = targetDay || dayNames[workoutDayIndex];

                if (todayDayName === "Saturday") {
                    const checkpointData = getCheckpointData(absWeek);
                    if (checkpointData) {
                        todayData = { day: todayDayName, title: "Checkpoint Testing", segments: generateCheckpointWorkout(absWeek) };
                    }
                }

                setTodaysWorkout(todayData);
                setSegments(todayData.segments || []);

                const { data: existingLogs } = await supabase.from('logs').select('segment_name').eq('user_id', profileId).eq('week_number', absWeek).eq('day_name', todayDayName);
                if (existingLogs && existingLogs.length > 0) {
                    const segmentNames = todayData.segments?.map((s: WorkoutSegment) => s.name) || [];
                    const alreadyLogged = new Set<number>();
                    existingLogs.forEach(log => {
                        const idx = segmentNames.indexOf(log.segment_name);
                        if (idx !== -1) alreadyLogged.add(idx);
                    });
                    setLoggedSegments(alreadyLogged);
                }

                const { data: session } = await supabase.from('workout_sessions').select('id').eq('user_id', profileId).eq('day_name', todayDayName).eq('week_number', absWeek).order('created_at', { ascending: false }).limit(1).maybeSingle();
                if (session) {
                    setActiveSessionId(session.id);
                } else {
                    const { data: newSession } = await supabase.from('workout_sessions').insert({ user_id: profileId, day_name: todayDayName, week_number: absWeek, phase_id: phaseIdx + 1, session_title: todayData.title, start_time: new Date().toISOString() }).select().single();
                    if (newSession) setActiveSessionId(newSession.id);
                }
            }
            setLoading(false);
        }
        fetchData();
    }, []);

    const handleFinishWorkout = async (data: PostFlightData) => {
        const supabase = createClient();
        if (activeSessionId) {
            await supabase.from('workout_sessions').update({ perceived_exertion: data.rpe, notes: data.notes, tags: data.tags, end_time: new Date().toISOString() }).eq('id', activeSessionId);
        }
        window.location.href = "/?week=" + currentWeek;
    };

    const calcWeight = (segmentName: string, percent: number) => {
        if (!profile) return { weight: 0, isEstimate: false, needsCalibration: true };
        const result = calculateWorkingSet(segmentName, percent, profile);

        // Normalize for units
        let displayWeight = result.weight;
        if (units === 'metric') {
            displayWeight = Math.round((result.weight * 0.453592) / 2.5) * 2.5;
        } else {
            displayWeight = Math.round(result.weight / 5) * 5;
        }

        return { ...result, weight: displayWeight };
    };

    const estimate1RM = (weight: number, reps: number) => Math.round(weight / (1.0278 - (0.0278 * reps)));

    const checkPr = async (segmentName: string, segmentType: string, val1: number, val2: number) => {
        // Exclude Accessories, Warmups, and Skills from PR entitlement
        if (segmentType === 'ACCESSORY' || segmentType === 'WARMUP' || segmentType === 'SKILL') return;

        if (!profile) return;
        const name = segmentName.toLowerCase();

        // Strict exclusion for DB/Dumbbell on main lifts unless it's a specific variation we track (none currently)
        if (name.includes('db') || name.includes('dumbbell') || name.includes('kettlebell') || name.includes('kb')) {
            if (!name.includes('snatch')) { // Allow KB Snatch if that becomes a thing? For now, safer to exclude all DB variants from Barbell Maxes.
                // Actually, let's just rely on the specific string matches below + segmentType. 
                // If a user names their main lift "DB Squat" and marks it MAIN_LIFT, should it update Squat Max? PROBABLY NOT.
                // So let's add a guard against "DB/Dumbbell" for the strength types.
            }
        }

        const startValue = val1; // Weight (lbs) usually
        const reps = val2;

        let type: keyof UserProfile | null = null;
        let isTime = false;
        let isWatts = false;

        // --- Strength Maxes ---
        if (reps > 0 && segmentType === 'MAIN_LIFT') {
            // Only estimate 1RM if reps are involved (Strength)
            // Explicitly exclude non-barbell keywords for safety
            const isBarbell = !name.includes('db') && !name.includes('dumbbell') && !name.includes('kb') && !name.includes('kettlebell') && !name.includes('machine') && !name.includes('cable');

            if (isBarbell) {
                if (name.includes('front squat')) type = 'front_squat_max';
                else if (name.includes('back squat') || (name.includes('squat') && !name.includes('split'))) type = 'squat_max';
                else if (name.includes('clean') && name.includes('jerk')) type = 'clean_jerk_max';
                else if (name.includes('snatch')) type = 'snatch_max';
                else if (name.includes('overhead') || name.includes('ohp') || name.includes('press') && !name.includes('bench') && !name.includes('leg')) type = 'ohp_max';
                else if (name.includes('bench')) type = 'bench_max';
                else if (name.includes('deadlift') && !name.includes('rdl') && !name.includes('stiff')) type = 'deadlift_max';
            }
        }

        // --- Cardio Benchmarks (Time-based or Watts) ---
        // For cardio, we expect checkPr to be called with (TimeInSeconds, 0) or (Watts, 0) maybe?
        // I need to update the call sites first to pass correct data for cardio.
        // I'll handle the logic here assuming I pass Seconds or Watts as val1.

        if (name.includes('mile run')) { type = 'mile_time_sec'; isTime = true; }
        else if (name.includes('5k')) { type = 'k5_time_sec'; isTime = true; }
        else if (name.includes('400m')) { type = 'sprint_400m_sec'; isTime = true; }
        else if (name.includes('2k') && name.includes('row')) { type = 'row_2k_sec'; isTime = true; }
        else if (name.includes('500m') && name.includes('row')) { type = 'row_500m_sec'; isTime = true; }
        else if (name.includes('ski') && name.includes('1k')) { type = 'ski_1k_sec'; isTime = true; }
        else if (name.includes('bike') && name.includes('max watts')) { type = 'bike_max_watts'; isWatts = true; }

        if (type) {
            const supabase = createClient();

            // Calculate Comparison Value
            let newValue = startValue;
            if (!isTime && !isWatts && reps > 0) {
                // Estimate 1RM
                newValue = estimate1RM(startValue, reps);
            }

            const currentMax = Number(profile[type]) || 0;
            let isPr = false;

            if (isTime) {
                // Lower is better. If currentMax is 0 (untested), it's a PR.
                if (currentMax === 0 || newValue < currentMax) isPr = true;
            } else {
                // Higher is better (Weight or Watts)
                if (newValue > currentMax) isPr = true;
            }

            if (isPr) {
                // 1. Celebrate
                const displayVal = isTime
                    ? newValue // Seconds will be formatted by Celebration component if needed? No, Celebration expects number.
                    : (isWatts ? newValue : Number(toDisplayWeight(newValue, units)));

                const unitLabel = isTime ? 's' : (isWatts ? 'w' : getUnitLabel(units, 'weight'));

                // Ideally we format time for celebration... but for now simple value
                setPrCelebration({ show: true, value: displayVal, unit: unitLabel });

                // 2. Update DB Profile
                await supabase.from('profiles').update({ [type]: newValue }).eq('id', profile.id);

                // 3. Update Local Profile State so calculation logic uses new max immediately
                setProfile(prev => prev ? ({ ...prev, [type]: newValue }) : null);

                // 4. Log to PR History
                await supabase.from('pr_history').insert({
                    user_id: profile.id,
                    exercise_name: segmentName,
                    value: newValue,
                    unit: isTime ? 'sec' : (isWatts ? 'watts' : 'lbs'),
                    pr_type: isTime ? 'Time Trial' : (isWatts ? 'Max Watts' : (reps === 1 ? '1RM' : '1RM (Est)'))
                });
            }
        }
    };

    const logSegment = async (segment: WorkoutSegment, idx: number, data: Record<string, unknown>) => {
        const el = document.getElementById(`status-${idx}`);
        if (el) el.classList.remove('hidden');

        // Strength / Watts PRs (Weight or Watts passed as val1)
        if (data.sets && Array.isArray(data.sets) && data.sets.length > 0) {
            const sets = data.sets as { weight?: number; reps?: number }[];
            const bestSet = sets.reduce((prev, current) => (current.weight || 0) > (prev.weight || 0) ? current : prev, sets[0]);
            if (bestSet && bestSet.weight && bestSet.reps) await checkPr(segment.name, segment.type, bestSet.weight, bestSet.reps);
        } else if (data.weight && data.reps) {
            await checkPr(segment.name, segment.type, Number(data.weight), Number(data.reps));
        }

        // Cardio Time PRs (Duration passed as time)
        // LogCardioBasic returns duration_min. LogMetcon returns time_min.
        const durationStr = String(data.duration_min || data.time_min || '');
        if (durationStr) {
            const minutes = parseFloat(durationStr) || 0;
            const seconds = minutes * 60;
            if (seconds > 0) {
                await checkPr(segment.name, segment.type, seconds, 0);
            }
        }

        // Cardio Watts PRs
        if (data.watts) {
            await checkPr(segment.name, segment.type, Number(data.watts), 0);
        }

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const currentUserId = user?.id || DEMO_USER_ID;

        await supabase.from('logs').delete().eq('user_id', currentUserId).eq('segment_name', segment.name).eq('week_number', currentWeek).eq('day_name', actualDayName);
        await supabase.from('logs').insert({ user_id: currentUserId, session_id: activeSessionId, segment_name: segment.name, segment_type: segment.type, tracking_mode: segment.tracking_mode, performance_data: data, phase_id: currentPhase, week_number: currentWeek, day_name: actualDayName });
        setLoggedSegments(prev => new Set([...prev, idx]));
    };

    const enableEditMode = (idx: number) => {
        setLoggedSegments(prev => { const updated = new Set([...prev]); updated.delete(idx); return updated; });
    };

    const workoutStatus = segments.reduce((acc, s) => {
        if (!s.target?.percent_1rm) return acc;
        const res = calcWeight(s.name, s.target.percent_1rm);
        if (res.needsCalibration) acc.needsCalibration = true;
        if (res.isEstimate) acc.hasEstimates = true;
        return acc;
    }, { needsCalibration: false, hasEstimates: false });

    if (loading) return <div className="flex h-[60vh] items-center justify-center text-muted-foreground font-serif animate-pulse text-xl">Preparing Pulse Environment...</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-16 pb-32">
            <PostFlightModal isOpen={showPostFlight} onClose={() => setShowPostFlight(false)} onFinish={handleFinishWorkout} />
            <PrCelebration show={prCelebration.show} value={prCelebration.value} unit={prCelebration.unit} onComplete={() => setPrCelebration({ ...prCelebration, show: false })} />
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-12">
                {workoutStatus.needsCalibration && profile?.id !== DEMO_USER_ID && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-[32px] p-8 flex items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-600">
                                <Activity size={24} />
                            </div>
                            <div>
                                <h3 className="font-serif text-xl text-amber-900 italic">Uncalibrated Sequence</h3>
                                <p className="text-amber-700/70 text-sm">This workout contains loads based on missing PRs. Some targets will be defaulted until you calibrate.</p>
                            </div>
                        </div>
                        <a href="/profile" className="px-6 py-3 bg-amber-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-amber-700 transition-colors shrink-0">Calibrate Now</a>
                    </div>
                )}
                {!workoutStatus.needsCalibration && workoutStatus.hasEstimates && profile?.id !== DEMO_USER_ID && (
                    <div className="bg-primary/5 border border-primary/10 rounded-[32px] p-8 flex items-center gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <Zap size={24} />
                        </div>
                        <div>
                            <h3 className="font-serif text-xl text-foreground italic">Intelligent Calibration Active</h3>
                            <p className="text-muted-foreground text-sm">We&apos;ve estimated your secondary loads based on your primary Bench and Squat PRs. Update your profile for absolute precision.</p>
                        </div>
                    </div>
                )}
                <header className="space-y-4">
                    <div className="flex items-center gap-2 text-primary"><HeartPulse size={16} className="animate-pulse" /><span className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-60">Live Pulse Session</span></div>
                    <h1 className="font-serif text-6xl md:text-8xl text-foreground leading-[0.85] tracking-tight">{todaysWorkout?.title}</h1>
                    <p className="text-muted-foreground text-xl font-light italic max-w-2xl">{todaysWorkout?.description || "Calibrate your output. Maintain the protocol's intensity spectrum."}</p>
                </header>
                <div className="space-y-8">
                    {segments.map((segment, idx) => {
                        const Icon = getSegmentIcon(segment.type, segment.name, actualDayName);
                        const details = renderSegmentDetails(segment, profile);
                        return (
                            <TiltCard key={idx} glowColor={segment.type === 'MAIN_LIFT' ? "shadow-primary/10" : "shadow-muted-foreground/5"} className="group rounded-[48px] p-10 overflow-hidden">
                                <div className={`absolute -right-12 -bottom-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-300 pointer-events-none ${segment.type === 'MAIN_LIFT' ? 'text-primary' : 'text-muted-foreground'}`}><Icon size={180} strokeWidth={1} /></div>
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-10 relative z-10">
                                    <div className="flex-1 space-y-8">
                                        <div className="flex items-center gap-4">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${segment.type === 'MAIN_LIFT' ? 'bg-primary/5 text-primary' : 'bg-muted text-muted-foreground'}`}>{segment.type.replace('_', ' ')}</span>
                                            <h2 className="font-serif text-4xl text-foreground tracking-tight italic">{segment.name}</h2>
                                            <span id={`status-${idx}`} className={`text-emerald-500 ${loggedSegments.has(idx) ? '' : 'hidden'} drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]`}><CheckCircle size={32} /></span>
                                        </div>
                                        <div className="space-y-5">
                                            {segment.target?.sets && (
                                                <div className="flex items-center gap-4 text-foreground">
                                                    <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground"><Target size={20} /></div>
                                                    <span className="font-serif text-3xl italic tracking-tight">{segment.target.sets} <span className="text-muted-foreground font-sans text-sm not-italic uppercase tracking-widest font-bold mx-1">sets of</span> {segment.target.reps}</span>
                                                </div>
                                            )}
                                            {segment.target?.percent_1rm && (() => {
                                                const { weight, isEstimate, needsCalibration, source } = calcWeight(segment.name, segment.target.percent_1rm);
                                                return (
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${needsCalibration ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-primary/5 border-primary/10 text-primary'}`}>
                                                            <Zap size={20} />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className={`text-xl font-light ${needsCalibration ? 'text-amber-600/60' : 'text-muted-foreground'}`}>
                                                                Load: <span className={`font-serif text-3xl italic tracking-tight ${needsCalibration ? 'text-amber-600' : 'text-foreground'}`}>
                                                                    {needsCalibration ? "Calibration Required" : `${weight}${getUnitLabel(units, 'weight')}`}
                                                                </span>
                                                                {!needsCalibration && isEstimate && (
                                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary/40 ml-3 bg-primary/5 px-2 py-0.5 rounded-full">Estimated</span>
                                                                )}
                                                            </span>
                                                            {!needsCalibration && isEstimate && source && (
                                                                <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest mt-1">{source}</span>
                                                            )}
                                                            {needsCalibration && (
                                                                <a href="/profile" className="text-[10px] font-bold text-amber-600 uppercase tracking-widest hover:underline mt-1">Configure Personal Records</a>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                    <div className="w-full md:w-auto flex items-center justify-end">
                                        {loggedSegments.has(idx) ? (
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-6 py-4"><CheckCircle className="text-emerald-500" size={20} /><span className="text-emerald-600 font-bold text-xs uppercase tracking-widest">Synchronized</span></div>
                                                <button onClick={() => enableEditMode(idx)} className="text-xs text-muted-foreground hover:text-primary underline">Edit Entry</button>
                                            </div>
                                        ) : (
                                            <>
                                                {segment.tracking_mode === 'CHECKBOX' && <button onClick={() => logSegment(segment, idx, { completed: true })} className="h-24 w-24 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center hover:bg-primary hover:text-white transition-all"><CheckCircle size={36} /></button>}
                                                {segment.tracking_mode === 'STRENGTH_SETS' && <LogStrengthSets segment={segment} idx={idx} onLog={logSegment} calculatedWeight={segment.target?.percent_1rm ? calcWeight(segment.name, segment.target.percent_1rm).weight : undefined} />}
                                                {segment.tracking_mode === 'METCON' && <LogMetcon segment={segment} idx={idx} onLog={logSegment} />}
                                                {segment.tracking_mode === 'CARDIO_BASIC' && <LogCardioBasic segment={segment} idx={idx} onLog={logSegment} />}
                                            </>
                                        )}
                                    </div>
                                </div>
                                {details && <div className="mt-8 relative z-10">{details}</div>}
                            </TiltCard>
                        );
                    })}
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowPostFlight(true)} className="w-full py-10 rounded-[48px] bg-foreground text-background text-3xl font-serif italic flex items-center justify-center gap-6 shadow-2xl transition-all hover:bg-primary hover:text-primary-foreground">Complete Pulse Sequence <ArrowRight size={28} /></motion.button>
            </motion.div>
        </div>
    );
}
