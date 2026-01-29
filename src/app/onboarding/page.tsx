"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ruler, Weight, Activity, ChevronRight, User, Globe, Bot, Dumbbell, Sparkles, CheckCircle2, Timer, Zap, ArrowRight } from "lucide-react";
import { updateOnboardingData } from "@/app/actions/user";
import { logout } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { GUEST_MODE_COOKIE } from "@/lib/constants";
import { estimateMissingMaxes } from "@/lib/calculations/percentages";
import { UserProfile } from "@/lib/types";

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
    const [selectedCategories, setSelectedCategories] = useState<string[]>(['strength']); // 'strength', 'olympic', 'cardio', 'power'

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
        ai_personality: "Clinical"
    });

    const updateField = (field: string, value: string) => {
        setFormState(prev => ({ ...prev, [field]: value }));
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

    return (
        <div className="min-h-screen bg-[#F5F5F4] flex flex-col items-center justify-center p-6 text-stone-900 font-sans relative overflow-hidden">

            {/* Background Atmosphere */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 -left-20 w-[600px] h-[600px] bg-rose-500/5 blur-[128px] rounded-full" />
                <div className="absolute bottom-1/4 -right-20 w-[600px] h-[600px] bg-rose-500/5 blur-[128px] rounded-full" />
            </div>

            <form
                onSubmit={async (e) => {
                    e.preventDefault();
                    if (step !== 5) return;
                    if (isGuest) { router.push('/'); return; }

                    const formData = new FormData();
                    Object.entries(formState).forEach(([key, val]) => {
                        if (key === 'mile_time') formData.append('mile_time_sec', parseTime(val).toString());
                        else if (key === 'row_2k') formData.append('row_2k_sec', parseTime(val).toString());
                        else formData.append(key, val);
                    });
                    formData.append('units', units);

                    await updateOnboardingData(formData);
                }}
                className="relative w-full max-w-xl z-10"
            >
                <AnimatePresence mode="wait">

                    {/* STEP 1-3 (Identity, Units, Physicals) - largely unchanged but condensed for brevity in this file update */}
                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="space-y-10">
                            <div className="text-center space-y-6">
                                <div className="relative mx-auto w-20 h-20">
                                    <User size={32} className="text-stone-900 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                    <div className="absolute inset-0 bg-rose-500/20 blur-2xl rounded-full animate-pulse" />
                                </div>
                                <h1 className="text-5xl font-serif text-stone-900 tracking-tight">Identity.</h1>
                            </div>
                            <input
                                type="text"
                                placeholder="Enter your name"
                                value={formState.full_name}
                                onChange={(e) => updateField('full_name', e.target.value)}
                                className="w-full bg-transparent text-3xl font-serif text-stone-900 text-center outline-none placeholder:text-stone-200"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && formState.full_name && setStep(2)}
                            />
                            <button type="button" onClick={() => setStep(2)} className="w-full bg-stone-900 text-white h-16 rounded-2xl font-bold">Next</button>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="space-y-10">
                            <h2 className="text-4xl font-serif text-center text-stone-900 italic">Measurement Protocol</h2>
                            <div className="grid grid-cols-2 gap-4">
                                {(['imperial', 'metric'] as const).map((mode) => (
                                    <button key={mode} type="button" onClick={() => setUnits(mode)} className={`p-10 rounded-3xl border ${units === mode ? "bg-white border-rose-500/30" : "bg-transparent border-transparent"}`}>
                                        <span className="text-xl font-serif capitalize">{mode}</span>
                                    </button>
                                ))}
                            </div>
                            <button type="button" onClick={() => setStep(3)} className="w-full bg-stone-900 text-white h-16 rounded-2xl font-bold">Next</button>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="space-y-10">
                            <h2 className="text-4xl font-serif text-center text-stone-900 italic">Physical Baseline</h2>
                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-3xl flex items-center justify-between">
                                    <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Height</label>
                                    {units === 'imperial' ? (
                                        <div className="flex gap-2">
                                            <input type="number" placeholder="6" value={formState.height_ft} onChange={e => updateField('height_ft', e.target.value)} className="w-12 text-2xl font-serif text-right outline-none" />
                                            <span className="text-stone-300 text-2xl font-serif">'</span>
                                            <input type="number" placeholder="2" value={formState.height_in} onChange={e => updateField('height_in', e.target.value)} className="w-12 text-2xl font-serif text-right outline-none" />
                                            <span className="text-stone-300 text-2xl font-serif">"</span>
                                        </div>
                                    ) : (
                                        <input type="number" placeholder="185" value={formState.height_cm} onChange={e => updateField('height_cm', e.target.value)} className="w-24 text-2xl font-serif text-right outline-none" />
                                    )}
                                </div>
                                <div className="bg-white p-6 rounded-3xl flex items-center justify-between">
                                    <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Weight</label>
                                    <input type="number" placeholder={units === 'imperial' ? "195" : "88"} value={formState.weight} onChange={e => updateField('weight', e.target.value)} className="w-24 text-2xl font-serif text-right outline-none" />
                                </div>
                            </div>
                            <button type="button" onClick={() => setStep(4)} className="w-full bg-stone-900 text-white h-16 rounded-2xl font-bold">Next</button>
                        </motion.div>
                    )}

                    {/* STEP 4: PERFORMANCE MATRIX (New Flow) */}
                    {step === 4 && subStep === 'SELECTION' && (
                        <motion.div key="step4-select" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="space-y-8">
                            <div className="text-center space-y-2">
                                <h2 className="text-4xl font-serif text-stone-900 italic">Performance Matrix</h2>
                                <p className="text-stone-400 text-[10px] uppercase tracking-[0.3em] font-bold">Select the modalities you track</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { id: 'strength', label: 'Powerlifting', icon: Dumbbell },
                                    { id: 'olympic', label: 'Olympic Weightlifting', icon: Activity },
                                    { id: 'cardio', label: 'Running / Endurance', icon: Timer },
                                    { id: 'power', label: 'Power Output (Watts)', icon: Zap },
                                ].map(cat => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => toggleCategory(cat.id)}
                                        className={`p-6 rounded-3xl border flex flex-col items-center gap-3 transition-all ${selectedCategories.includes(cat.id) ? "bg-rose-50 border-rose-500/30 text-rose-700" : "bg-white border-transparent text-stone-400 hover:bg-stone-50"}`}
                                    >
                                        <cat.icon size={24} />
                                        <span className="text-sm font-bold">{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                            <button type="button" onClick={() => setSubStep('INPUT')} className="w-full bg-stone-900 text-white h-16 rounded-2xl font-bold flex items-center justify-center gap-2">
                                Enter Known Maxes <ChevronRight size={18} />
                            </button>
                        </motion.div>
                    )}

                    {step === 4 && subStep === 'INPUT' && (
                        <motion.div key="step4-input" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-8">
                            <div className="text-center">
                                <h2 className="text-3xl font-serif text-stone-900 italic">Input Data</h2>
                                <p className="text-stone-400 text-[10px] uppercase tracking-[0.2em] font-bold">Leave blank if unknown</p>
                            </div>

                            <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
                                {/* Always show Squat/Bench as anchors */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest pl-2">Primary Anchors</h3>
                                    <div className="grid grid-cols-1 gap-3">
                                        <input type="number" placeholder="Back Squat" value={formState.squat_max} onChange={e => updateField('squat_max', e.target.value)} className="w-full p-4 rounded-2xl bg-white border border-stone-100 text-lg outline-none focus:border-rose-200" />
                                        <input type="number" placeholder="Bench Press" value={formState.bench_max} onChange={e => updateField('bench_max', e.target.value)} className="w-full p-4 rounded-2xl bg-white border border-stone-100 text-lg outline-none focus:border-rose-200" />
                                    </div>
                                </div>

                                {selectedCategories.includes('strength') && (
                                    <div className="space-y-3">
                                        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest pl-2">Secondary Strength</h3>
                                        <input type="number" placeholder="Deadlift" value={formState.deadlift_max} onChange={e => updateField('deadlift_max', e.target.value)} className="w-full p-4 rounded-2xl bg-white border border-stone-100 text-lg outline-none" />
                                        <input type="number" placeholder="Overhead Press" value={formState.ohp_max} onChange={e => updateField('ohp_max', e.target.value)} className="w-full p-4 rounded-2xl bg-white border border-stone-100 text-lg outline-none" />
                                    </div>
                                )}

                                {selectedCategories.includes('olympic') && (
                                    <div className="space-y-3">
                                        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest pl-2">Olympic Lifts</h3>
                                        <input type="number" placeholder="Clean & Jerk" value={formState.clean_jerk_max} onChange={e => updateField('clean_jerk_max', e.target.value)} className="w-full p-4 rounded-2xl bg-white border border-stone-100 text-lg outline-none" />
                                        <input type="number" placeholder="Snatch" value={formState.snatch_max} onChange={e => updateField('snatch_max', e.target.value)} className="w-full p-4 rounded-2xl bg-white border border-stone-100 text-lg outline-none" />
                                        <input type="number" placeholder="Front Squat" value={formState.front_squat_max} onChange={e => updateField('front_squat_max', e.target.value)} className="w-full p-4 rounded-2xl bg-white border border-stone-100 text-lg outline-none" />
                                    </div>
                                )}

                                {selectedCategories.includes('cardio') && (
                                    <div className="space-y-3">
                                        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest pl-2">Endurance (mm:ss)</h3>
                                        <input type="text" placeholder="1 Mile Run (e.g. 6:30)" value={formState.mile_time} onChange={e => updateField('mile_time', e.target.value)} className="w-full p-4 rounded-2xl bg-white border border-stone-100 text-lg outline-none" />
                                        <input type="text" placeholder="2k Row (e.g. 7:15)" value={formState.row_2k} onChange={e => updateField('row_2k', e.target.value)} className="w-full p-4 rounded-2xl bg-white border border-stone-100 text-lg outline-none" />
                                    </div>
                                )}

                                {selectedCategories.includes('power') && (
                                    <div className="space-y-3">
                                        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest pl-2">Power Output</h3>
                                        <input type="number" placeholder="Max Watts (Air Bike)" value={formState.bike_max_watts} onChange={e => updateField('bike_max_watts', e.target.value)} className="w-full p-4 rounded-2xl bg-white border border-stone-100 text-lg outline-none" />
                                    </div>
                                )}
                            </div>
                            <button type="button" onClick={() => setSubStep('REVEAL')} className="w-full bg-stone-900 text-white h-16 rounded-2xl font-bold flex items-center justify-center gap-2">
                                Calibrate Profile <Sparkles size={18} />
                            </button>
                        </motion.div>
                    )}

                    {/* REVEAL STEP: Show Pulse Estimates */}
                    {step === 4 && subStep === 'REVEAL' && (
                        <motion.div key="step4-reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                            <div className="text-center space-y-2">
                                <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-600 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
                                    <Zap size={12} fill="currentColor" /> Pulse Intelligence Active
                                </div>
                                <h2 className="text-3xl font-serif text-stone-900 italic">Profile Calibrated</h2>
                                <p className="text-stone-400 text-sm max-w-sm mx-auto">
                                    We've filled in the missing gaps using your anchors.
                                    <br />This ensures your first workout is optimized.
                                </p>
                            </div>

                            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-stone-100 space-y-4">
                                <div className="flex justify-between items-center border-b border-stone-100 pb-4">
                                    <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Metric</span>
                                    <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Value</span>
                                </div>
                                {/* Show a few key examples */}
                                {[
                                    { label: 'Front Squat', val: estimatedProfile?.front_squat_max, isEst: !formState.front_squat_max },
                                    { label: 'Clean & Jerk', val: estimatedProfile?.clean_jerk_max, isEst: !formState.clean_jerk_max },
                                    { label: 'OHP', val: estimatedProfile?.ohp_max, isEst: !formState.ohp_max },
                                    { label: 'Bike Watts', val: estimatedProfile?.bike_max_watts, isEst: !formState.bike_max_watts },
                                ].map(item => (
                                    <div key={item.label} className="flex justify-between items-center">
                                        <span className="text-stone-600 font-medium">{item.label}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-serif text-xl text-stone-900">{item.val || '-'}</span>
                                            {item.isEst && <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">EST</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button type="button" onClick={() => setStep(5)} className="w-full bg-stone-900 text-white h-16 rounded-2xl font-bold flex items-center justify-center gap-2">
                                Finalize Setup <ArrowRight size={18} />
                            </button>
                        </motion.div>
                    )}


                    {/* STEP 5: AI CONFIG (Final) - Simplified from original to save space but keeping functionality */}
                    {step === 5 && (
                        <motion.div key="step5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                            <div className="text-center">
                                <h2 className="text-4xl font-serif text-stone-900 italic">Pulse Agent</h2>
                                <p className="text-stone-400 text-[10px] uppercase tracking-[0.3em] font-bold">Your digital coach</p>
                            </div>
                            <div className="space-y-4">
                                <input type="text" placeholder="Agent Name (e.g. ECHO)" value={formState.ai_name} onChange={e => updateField('ai_name', e.target.value)} className="w-full p-6 text-center text-3xl font-serif bg-white rounded-[32px] outline-none" />
                                <div className="grid grid-cols-2 gap-3">
                                    {['Stoic', 'Motivational', 'Clinical', 'Direct'].map(p => (
                                        <button key={p} type="button" onClick={() => updateField('ai_personality', p)} className={`p-4 rounded-xl border text-sm font-bold uppercase tracking-widest ${formState.ai_personality === p ? "bg-rose-600 text-white border-rose-600" : "bg-white text-stone-400"}`}>
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-rose-600 text-white h-20 rounded-[32px] font-bold text-lg shadow-xl shadow-rose-600/20">
                                Initialize System
                            </button>
                        </motion.div>
                    )}

                </AnimatePresence>
            </form>
        </div>
    );
}
