"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ruler, Weight, Activity, ChevronRight, User, Globe, Bot, Dumbbell, Sparkles, CheckCircle2, Timer, Zap, ArrowRight, Scan, Heart, BatteryCharging, ChevronLeft } from "lucide-react";
import { FloatingInput } from "@/components/FloatingInput";
import { updateOnboardingData } from "@/app/actions/user";
import { logout } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { GUEST_MODE_COOKIE } from "@/lib/constants";
import { estimateMissingMaxes } from "@/lib/calculations/percentages";
import { UserProfile } from "@/lib/types";
import { NanoParticles } from "@/components/NanoParticles";

/**
 * Parse a specific cookie value from document.cookie string
 */
function getCookieValue(name: string): string | null {
    if (typeof document === "undefined") return null;
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [cookieName, cookieValue] = cookie.trim().split('=');
        if (cookieName === name) {
            return decodeURIComponent(cookieValue);
        }
    }
    return null;
}

// Time parser helper (mm:ss -> seconds)
const parseTime = (input: string): number => {
    if (!input) return 0;
    if (!input.includes(':')) return parseInt(input) || 0;
    const [mins, secs] = input.split(':').map(Number);
    return (mins * 60) + (secs || 0);
};

// Time formatter (seconds -> mm:ss)
const formatTime = (seconds: number): string => {
    if (!seconds) return "";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function OnboardingPage() {
    const [step, setStep] = useState(1);
    const [subStep, setSubStep] = useState<'SELECTION' | 'INPUT' | 'REVEAL'>('SELECTION');
    const [isGuest, setIsGuest] = useState(false);
    const [units, setUnits] = useState<"imperial" | "metric">("imperial");
    const [selectedCategories, setSelectedCategories] = useState<string[]>(['strength']);
    const [isBlackingOut, setIsBlackingOut] = useState(false);
    const [isPulsing, setIsPulsing] = useState(false);
    const [readyToPulse, setReadyToPulse] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [pulseSpeed, setPulseSpeed] = useState(1.4);

    // Estimates for the Reveal step
    const [estimatedProfile, setEstimatedProfile] = useState<UserProfile | null>(null);

    const router = useRouter();

    // Form data state
    const [formState, setFormState] = useState({
        full_name: "",
        height_ft: "",
        height_in: "",
        height_cm: "",
        weight: "",
        // Strength
        squat_max: "",
        bench_max: "",
        deadlift_max: "",
        // Olympic
        front_squat_max: "",
        clean_jerk_max: "",
        snatch_max: "",
        ohp_max: "",
        // Cardio (stored as strings mm:ss for input, converted on submit)
        mile_time: "",
        row_2k: "",
        // Power
        bike_max_watts: "",
        // AI
        ai_name: "",
        ai_personality: "Analytic"
    });

    const updateField = (field: string, value: string) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };

    const handleBack = () => {
        if (step === 4) {
            if (subStep === 'REVEAL') {
                setSubStep('INPUT');
                return;
            }
            if (subStep === 'INPUT') {
                setSubStep('SELECTION');
                return;
            }
        }

        if (step > 1) {
            setStep(prev => {
                const newStep = prev - 1;
                if (newStep === 4) setSubStep('REVEAL');
                else setSubStep('SELECTION');
                return newStep;
            });
        }
    };

    useEffect(() => {
        const checkGuestMode = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            const guestCookie = getCookieValue(GUEST_MODE_COOKIE.name);
            const isGuestMode = !user || guestCookie === GUEST_MODE_COOKIE.value;

            setIsGuest(isGuestMode);

            if (isGuestMode) {
                setUnits("imperial");
                setFormState(prev => ({
                    ...prev,
                    full_name: "Colby Reichenbach",
                    height_ft: "6", height_in: "2",
                    weight: "195",
                    squat_max: "345", bench_max: "245", deadlift_max: "405",
                    mile_time: "6:30",
                    ai_name: "ECHO-P1",
                }));
            }
        };
        checkGuestMode();
    }, []);

    // Calculate estimates for the Reveal step
    useEffect(() => {
        if (subStep === 'REVEAL') {
            const tempProfile: UserProfile = {
                id: 'temp',
                squat_max: parseInt(formState.squat_max) || 0,
                bench_max: parseInt(formState.bench_max) || 0,
                deadlift_max: parseInt(formState.deadlift_max) || 0,
                front_squat_max: parseInt(formState.front_squat_max) || 0,
                clean_jerk_max: parseInt(formState.clean_jerk_max) || 0,
                snatch_max: parseInt(formState.snatch_max) || 0,
                ohp_max: parseInt(formState.ohp_max) || 0,
                bike_max_watts: parseInt(formState.bike_max_watts) || 0,
            };
            const estimates = estimateMissingMaxes(tempProfile);
            setEstimatedProfile(estimates);
        }
    }, [subStep, formState]);

    const toggleCategory = (cat: string) => {
        setSelectedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    const handleFinalize = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step !== 5) return;

        // Stage 0: Pre-warm
        router.prefetch('/');

        // Stage 1: Transition to light background
        setIsBlackingOut(true);
        await new Promise(resolve => setTimeout(resolve, 800));

        // Stage 2: Data Sync + Heart Start (Slow)
        setIsPulsing(true);
        setPulseSpeed(1.4);

        if (!isGuest) {
            const formData = new FormData();
            Object.entries(formState).forEach(([key, val]) => {
                if (key === 'mile_time') formData.append('mile_time_sec', parseTime(val).toString());
                else if (key === 'row_2k') formData.append('row_2k_sec', parseTime(val).toString());
                else formData.append(key, val);
            });
            formData.append('units', units);
            await updateOnboardingData(formData);
        }

        // Stage 3: Speed Up Pulse (Anticipation)
        setPulseSpeed(0.8);
        await new Promise(resolve => setTimeout(resolve, 1200));

        setPulseSpeed(0.4);
        await new Promise(resolve => setTimeout(resolve, 800));

        // Stage 4: THE FINAL PULSE + REDIRECT
        setReadyToPulse(true);
        setTimeout(() => {
            setIsRedirecting(true);
            setTimeout(() => router.push('/'), 400);
        }, 600);
    };

    const springTransition = { type: "spring", damping: 25, mass: 0.5, stiffness: 120 } as const;

    return (
        <div className="min-h-screen bg-[#f5f2ed] flex items-center justify-center p-6 text-zinc-900 font-sans relative overflow-hidden">
            <style>{`
                .glass {
                    background: rgba(245, 242, 237, 0.4);
                    backdrop-filter: blur(24px) saturate(180%);
                    -webkit-backdrop-filter: blur(24px) saturate(180%);
                    border: 1px solid rgba(0, 0, 0, 0.05);
                    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.03);
                }
                .btn-primary {
                    background: #ef4444;
                    color: white;
                    font-weight: 700;
                    border-radius: 1.5rem;
                    box-shadow: 0 10px 20px -5px rgba(239, 68, 68, 0.3);
                    position: relative;
                    overflow: hidden;
                }
                .btn-primary::after {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: linear-gradient(
                        transparent,
                        rgba(255, 255, 255, 0.1),
                        transparent
                    );
                    transform: rotate(35deg);
                    transition: 0.5s;
                    pointer-events: none;
                }
                .btn-primary:hover::after {
                    left: 120%;
                }
                @keyframes heartbeat-pulse {
                    0% { transform: scale(1); filter: drop-shadow(0 0 20px rgba(239,68,68,0.2)); }
                    15% { transform: scale(1.15); filter: drop-shadow(0 0 40px rgba(239,68,68,0.4)); }
                    30% { transform: scale(1); }
                    45% { transform: scale(1.2); filter: drop-shadow(0 0 50px rgba(239,68,68,0.5)); }
                    70% { transform: scale(1); }
                }
                .animate-heartbeat-pulse {
                    animation: heartbeat-pulse var(--pulse-speed, 1.4s) ease-in-out infinite;
                }
                @keyframes vibrate {
                    0% { transform: translate(0,0) rotate(0); }
                    10% { transform: translate(-1px,-1px) rotate(-0.5deg); }
                    20% { transform: translate(1px, 0) rotate(0.5deg); }
                    30% { transform: translate(-1px, 1px) rotate(0); }
                    40% { transform: translate(1px, -1px) rotate(0.5deg); }
                    50% { transform: translate(-1px, 0) rotate(-0.5deg); }
                    60% { transform: translate(1px, 1px) rotate(0); }
                    70% { transform: translate(-1px, -1px) rotate(0.5deg); }
                    100% { transform: translate(0,0) rotate(0); }
                }
                .animate-heartbeat-once {
                    animation: heartbeat-once 2.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .vibrate {
                    animation: vibrate 0.1s linear infinite;
                }
            `}</style>

            {/* Background Atmosphere - Matched to App DNA */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-red-500/20 shadow-[0_0_24px_rgba(239,68,68,0.4)] scan-line" />
                <div className="absolute top-[-5%] left-[-5%] w-[50%] h-[50%] bg-red-200/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-5%] right-[-5%] w-[60%] h-[60%] bg-[#ef4444]/10 blur-[140px] rounded-full" />
                <div className="absolute inset-0 bg-primary/2 animate-biometric-flicker" />
            </div>

            <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9, width: "100%", maxWidth: "448px" }} // max-w-md
                animate={{
                    opacity: isBlackingOut ? 0 : 1,
                    scale: isBlackingOut ? 0.95 : 1,
                    maxWidth: step === 4 && subStep === 'INPUT' ? "640px" : "448px",
                    height: "auto",
                    borderRadius: "3rem"
                }}
                transition={springTransition}
                className="glass relative z-20 flex flex-col overflow-hidden"
                style={{ minHeight: "550px" }}
            >
                <form
                    onSubmit={handleFinalize}
                    className="flex-grow p-12 flex flex-col justify-center relative"
                >
                    <AnimatePresence>
                        {step > 1 && (
                            <motion.button
                                type="button"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                onClick={handleBack}
                                className="absolute top-4 left-12 p-2 rounded-full hover:bg-zinc-100/50 transition-colors text-zinc-400 hover:text-zinc-900 z-50 group flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest"
                            >
                                <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                                Back
                            </motion.button>
                        )}
                    </AnimatePresence>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`${step}-${subStep}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={springTransition}
                            className="w-full"
                        >
                            {step === 1 && (
                                <div className="space-y-12">
                                    <div className="text-center space-y-4">
                                        <div className="relative mx-auto w-20 h-20">
                                            <User size={36} className="text-red-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                            <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full animate-pulse" />
                                        </div>
                                        <h1 className="text-6xl font-serif text-zinc-900 tracking-tight leading-tighter">Identity.</h1>
                                        <p className="text-[#ef4444] text-[10px] font-bold uppercase tracking-[0.4em]">Biometric Calibration</p>
                                    </div>
                                    <FloatingInput
                                        label="Full Name"
                                        value={formState.full_name}
                                        onChange={(e) => updateField('full_name', e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && formState.full_name && setStep(2)}
                                    />
                                    <motion.button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        whileHover={{ scale: 1.01, y: -2 }}
                                        whileTap={{ scale: 0.98, y: 0 }}
                                        transition={springTransition}
                                        className="w-full btn-primary h-16 mt-10"
                                    >
                                        Initiate Protocol
                                    </motion.button>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-12">
                                    <div className="text-center space-y-4">
                                        <h2 className="text-5xl font-serif text-zinc-900 italic">Unit Context</h2>
                                        <p className="text-red-500 text-[10px] font-bold uppercase tracking-[0.4em]">Data Standard Selection</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {(['imperial', 'metric'] as const).map((mode) => (
                                            <motion.button
                                                key={mode}
                                                type="button"
                                                onClick={() => setUnits(mode)}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.96 }}
                                                transition={springTransition}
                                                className={`p-10 rounded-3xl border transition-colors ${units === mode ? "bg-white border-red-200 shadow-md text-red-500" : "bg-transparent border-transparent text-zinc-400 hover:bg-white/40"}`}
                                            >
                                                <span className="text-xl font-serif capitalize">{mode}</span>
                                            </motion.button>
                                        ))}
                                    </div>
                                    <motion.button
                                        type="button"
                                        onClick={() => setStep(3)}
                                        whileHover={{ scale: 1.01, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        transition={springTransition}
                                        className="w-full btn-primary h-16"
                                    >
                                        Confirm Standard
                                    </motion.button>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-12">
                                    <div className="text-center space-y-4">
                                        <h2 className="text-5xl font-serif text-zinc-900 italic">Core Vitals</h2>
                                        <p className="text-red-500 text-[10px] uppercase tracking-[0.4em] font-bold">Physical Baseline</p>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="bg-white/40 border border-zinc-200 p-8 rounded-3xl flex items-center justify-between group focus-within:border-red-500/30 transition-colors">
                                            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Height</label>
                                            {units === 'imperial' ? (
                                                <div className="flex gap-2">
                                                    <input type="number" placeholder="6" value={formState.height_ft} onChange={e => updateField('height_ft', e.target.value)} className="w-12 text-3xl font-serif text-right outline-none bg-transparent text-zinc-900 placeholder-zinc-300" />
                                                    <span className="text-red-500 text-3xl font-serif">'</span>
                                                    <input type="number" placeholder="2" value={formState.height_in} onChange={e => updateField('height_in', e.target.value)} className="w-12 text-3xl font-serif text-right outline-none bg-transparent text-zinc-900 placeholder-zinc-300" />
                                                    <span className="text-red-500 text-3xl font-serif">"</span>
                                                </div>
                                            ) : (
                                                <input type="number" placeholder="185" value={formState.height_cm} onChange={e => updateField('height_cm', e.target.value)} className="w-24 text-3xl font-serif text-right outline-none bg-transparent text-zinc-900 placeholder-zinc-300" />
                                            )}
                                        </div>
                                        <div className="bg-white/40 border border-zinc-200 p-8 rounded-3xl flex items-center justify-between group focus-within:border-red-500/30 transition-colors">
                                            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Mass ({units === 'imperial' ? 'lbs' : 'kg'})</label>
                                            <input type="number" placeholder={units === 'imperial' ? "195" : "88"} value={formState.weight} onChange={e => updateField('weight', e.target.value)} className="w-24 text-3xl font-serif text-right outline-none bg-transparent text-zinc-900 placeholder-zinc-300" />
                                        </div>
                                    </div>
                                    <motion.button
                                        type="button"
                                        onClick={() => setStep(4)}
                                        whileHover={{ scale: 1.01, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        transition={springTransition}
                                        className="w-full btn-primary h-16"
                                    >
                                        Sync Physicals
                                    </motion.button>
                                </div>
                            )}

                            {step === 4 && subStep === 'SELECTION' && (
                                <div className="space-y-10">
                                    <div className="text-center space-y-4">
                                        <h2 className="text-5xl font-serif text-zinc-900 italic">Capacities</h2>
                                        <p className="text-red-500 text-[10px] uppercase tracking-[0.4em] font-bold">Select Active Modalities</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { id: 'strength', label: 'Powerlifting', icon: Dumbbell },
                                            { id: 'olympic', label: 'Olympic', icon: Activity },
                                            { id: 'cardio', label: 'Endurance', icon: Timer },
                                            { id: 'power', label: 'Power', icon: Zap },
                                        ].map(cat => (
                                            <motion.button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => toggleCategory(cat.id)}
                                                whileHover={{ scale: 1.03, y: -2 }}
                                                whileTap={{ scale: 0.95 }}
                                                transition={springTransition}
                                                className={`p-8 rounded-[2rem] border flex flex-col items-center gap-4 transition-colors ${selectedCategories.includes(cat.id) ? "bg-[#ef4444] border-[#ef4444] text-white shadow-lg shadow-red-500/20" : "bg-white/40 border-zinc-200 text-zinc-400 hover:bg-white/80 hover:border-red-200 hover:text-red-400"}`}
                                            >
                                                <cat.icon size={28} />
                                                <span className="text-xs font-bold uppercase tracking-widest leading-none">{cat.label}</span>
                                            </motion.button>
                                        ))}
                                    </div>
                                    <motion.button
                                        type="button"
                                        onClick={() => setSubStep('INPUT')}
                                        whileHover={{ scale: 1.01, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        transition={springTransition}
                                        className="w-full btn-primary h-16 flex items-center justify-center gap-3"
                                    >
                                        Enter Data <ArrowRight size={20} />
                                    </motion.button>
                                </div>
                            )}

                            {step === 4 && subStep === 'INPUT' && (
                                <div className="space-y-10">
                                    <div className="text-center space-y-4">
                                        <h2 className="text-4xl font-serif text-zinc-900 italic">Neural Sync</h2>
                                        <p className="text-red-500 text-[10px] uppercase tracking-[0.3em] font-bold">Initial Anchor Metrics</p>
                                    </div>

                                    <div className="space-y-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                        <div className="grid grid-cols-2 gap-4">
                                            <FloatingInput label="Back Squat" type="number" value={formState.squat_max} onChange={e => updateField('squat_max', e.target.value)} />
                                            <FloatingInput label="Bench Press" type="number" value={formState.bench_max} onChange={e => updateField('bench_max', e.target.value)} />
                                        </div>

                                        {selectedCategories.includes('strength') && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <FloatingInput label="Deadlift" type="number" value={formState.deadlift_max} onChange={e => updateField('deadlift_max', e.target.value)} />
                                                <FloatingInput label="OHP" type="number" value={formState.ohp_max} onChange={e => updateField('ohp_max', e.target.value)} />
                                            </div>
                                        )}

                                        {selectedCategories.includes('olympic') && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <FloatingInput label="Clean & Jerk" type="number" value={formState.clean_jerk_max} onChange={e => updateField('clean_jerk_max', e.target.value)} />
                                                <FloatingInput label="Snatch" type="number" value={formState.snatch_max} onChange={e => updateField('snatch_max', e.target.value)} />
                                            </div>
                                        )}

                                        {selectedCategories.includes('cardio') && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <FloatingInput label="1 Mile (m:s)" type="text" value={formState.mile_time} onChange={e => updateField('mile_time', e.target.value)} />
                                                <FloatingInput label="2k Row (m:s)" type="text" value={formState.row_2k} onChange={e => updateField('row_2k', e.target.value)} />
                                            </div>
                                        )}
                                    </div>
                                    <motion.button
                                        type="button"
                                        onClick={() => setSubStep('REVEAL')}
                                        whileHover={{ scale: 1.01, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        transition={springTransition}
                                        className="w-full btn-primary h-16 flex items-center justify-center gap-3"
                                    >
                                        Simulate Potential <Sparkles size={20} />
                                    </motion.button>
                                </div>
                            )}

                            {step === 4 && subStep === 'REVEAL' && (
                                <div className="space-y-10">
                                    <div className="text-center space-y-4">
                                        <div className="inline-flex items-center gap-2 bg-red-500 text-white px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-red-500/20">
                                            <Zap size={12} fill="currentColor" /> Neural Mapping Complete
                                        </div>
                                        <h2 className="text-4xl font-serif text-zinc-900 italic">Rhythm Synced</h2>
                                        <p className="text-zinc-500 text-sm max-w-xs mx-auto italic font-serif">
                                            Secondary performance markers calibrated via anchor interpolation.
                                        </p>
                                    </div>

                                    <div className="relative group/scroll bg-white/40 border border-zinc-200 rounded-[2.5rem] overflow-hidden">
                                        <div className="p-10 space-y-6 max-h-[320px] overflow-y-auto custom-scrollbar relative pr-6 scroll-smooth">
                                            {[
                                                { label: 'Front Squat', val: estimatedProfile?.front_squat_max, isEst: !formState.front_squat_max, unit: 'lbs' },
                                                { label: 'Deadlift', val: estimatedProfile?.deadlift_max, isEst: !formState.deadlift_max, unit: 'lbs' },
                                                { label: 'Clean & Jerk', val: estimatedProfile?.clean_jerk_max, isEst: !formState.clean_jerk_max, unit: 'lbs' },
                                                { label: 'Snatch', val: estimatedProfile?.snatch_max, isEst: !formState.snatch_max, unit: 'lbs' },
                                                { label: 'OHP', val: estimatedProfile?.ohp_max, isEst: !formState.ohp_max, unit: 'lbs' },
                                                { label: 'Bike Power', val: estimatedProfile?.bike_max_watts, isEst: !formState.bike_max_watts, unit: 'w' },
                                                { label: '1 Mile', val: estimatedProfile?.mile_time_sec ? formatTime(estimatedProfile.mile_time_sec) : null, isEst: !formState.mile_time, unit: '' },
                                                { label: '2k Row', val: estimatedProfile?.row_2k_sec ? formatTime(estimatedProfile.row_2k_sec) : null, isEst: !formState.row_2k, unit: '' },
                                            ].filter(item => item.val !== null && item.val !== undefined && item.val !== 0).map((item, i) => (
                                                <motion.div
                                                    key={item.label}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.05 + 0.2, duration: 0.4, ease: "easeOut" }}
                                                    className="flex justify-between items-center group/item hover:bg-white/20 p-2 -mx-2 rounded-2xl transition-all duration-300"
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em]">{item.label}</span>
                                                        {item.isEst && <span className="text-[8px] font-bold text-red-500 uppercase tracking-tighter">AI Estimated</span>}
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex flex-col items-end">
                                                            <span className="font-serif text-3xl text-zinc-900 leading-none">{item.val}</span>
                                                            <span className="text-[10px] text-zinc-400 font-bold uppercase">{item.unit}</span>
                                                        </div>
                                                        {item.isEst && (
                                                            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 group-hover/item:scale-110 group-hover/item:rotate-12 transition-transform duration-500">
                                                                <Sparkles size={14} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                        {/* Premium Edge Gradients */}
                                        <div className="absolute top-0 left-0 right-1.5 h-12 bg-gradient-to-b from-[#f5f2ed] via-[#f5f2ed]/50 to-transparent pointer-events-none rounded-t-[2.5rem] opacity-0 group-hover/scroll:opacity-100 transition-opacity duration-500" />
                                        <div className="absolute bottom-0 left-0 right-1.5 h-12 bg-gradient-to-t from-[#f5f2ed] via-[#f5f2ed]/50 to-transparent pointer-events-none rounded-b-[2.5rem] opacity-100 transition-opacity duration-500" />
                                    </div>

                                    <motion.button
                                        type="button"
                                        onClick={() => setStep(5)}
                                        whileHover={{ scale: 1.01, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        transition={springTransition}
                                        className="w-full btn-primary h-16 flex items-center justify-center gap-3"
                                    >
                                        Agent Handshake <ArrowRight size={20} />
                                    </motion.button>
                                </div>
                            )}

                            {step === 5 && (
                                <div className="space-y-10">
                                    <div className="text-center space-y-4">
                                        <h2 className="text-5xl font-serif text-zinc-900 italic">Agent Persona</h2>
                                        <p className="text-red-500 text-[10px] uppercase tracking-[0.4em] font-bold">Neural Interface Configuration</p>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                placeholder="SYSTEM CODE"
                                                value={formState.ai_name}
                                                onChange={e => updateField('ai_name', e.target.value)}
                                                className="w-full p-8 text-center text-4xl font-serif bg-white/40 border border-zinc-200 rounded-3xl outline-none text-zinc-900 placeholder-zinc-300 focus:ring-4 focus:ring-red-500/10 focus:border-red-500/20 transition-all uppercase tracking-widest"
                                            />
                                            <div className="absolute inset-0 bg-red-500/5 blur-xl rounded-3xl -z-10 opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            {['Analytic', 'Coach'].map(p => (
                                                <motion.button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => updateField('ai_personality', p)}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.97 }}
                                                    transition={springTransition}
                                                    className={`p-6 rounded-2xl border text-xs font-bold uppercase tracking-[0.3em] transition-colors ${formState.ai_personality === p ? "bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20" : "bg-white/40 text-zinc-400 hover:bg-white/80 border-transparent"}`}
                                                >
                                                    {p}
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>
                                    <motion.button
                                        type="submit"
                                        whileHover={{ scale: 1.01, y: -3 }}
                                        whileTap={{ scale: 0.97 }}
                                        transition={springTransition}
                                        className="w-full btn-primary h-20 text-xl tracking-wide"
                                    >
                                        INITIALIZE PULSE
                                    </motion.button>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </form>

                {/* Status Bar - Bottom of Glass */}
                <div className="px-12 py-8 bg-red-500/[0.03] border-t border-red-500/[0.05] flex justify-between items-center shrink-0">
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(s => (
                            <div key={s} className={`h-1.5 rounded-full transition-all duration-700 ${s === step ? 'w-10 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : s < step ? 'w-3 bg-zinc-900' : 'w-3 bg-zinc-200'}`} />
                        ))}
                    </div>

                </div>
            </motion.div>

            {/* Cinematic Transition Overlay */}
            <AnimatePresence>
                {isBlackingOut && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isRedirecting ? 0 : 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="fixed inset-0 bg-[#f5f2ed] z-[100] flex items-center justify-center pointer-events-none"
                    >
                        <AnimatePresence>
                            {isPulsing && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="relative flex items-center justify-center"
                                >
                                    <div
                                        className="relative pointer-events-none z-10"
                                        style={{ '--pulse-speed': `${pulseSpeed}s` } as any}
                                    >
                                        <Heart
                                            className="w-64 h-64 text-[#ef4444] fill-[#ef4444] animate-heartbeat-pulse"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
