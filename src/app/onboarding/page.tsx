"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ruler, Weight, Activity, ChevronRight, User, Globe, Bot, Dumbbell, Sparkles, CheckCircle2 } from "lucide-react";
import { updateOnboardingData } from "@/app/actions/user";
import { logout } from "@/app/actions/auth";

export default function OnboardingPage() {
    const [step, setStep] = useState(1);
    const [isGuest, setIsGuest] = useState(false);
    const [units, setUnits] = useState<"imperial" | "metric">("imperial");

    // Form data state - persisted across all steps
    const [formState, setFormState] = useState({
        full_name: "",
        height_ft: "",
        height_in: "",
        height_cm: "",
        weight: "",
        squat_max: "",
        bench_max: "",
        deadlift_max: "",
        ai_name: "",
        ai_personality: "Clinical"
    });

    const updateField = (field: string, value: string) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };

    useEffect(() => {
        const checkGuest = () => {
            if (typeof document !== "undefined") {
                setIsGuest(document.cookie.includes("guest-mode=true"));
                if (document.cookie.includes("guest-mode=true")) {
                    setUnits("imperial");
                    // Set default values for guest
                    setFormState({
                        full_name: "Colby Reichenbach",
                        height_ft: "6",
                        height_in: "2",
                        height_cm: "",
                        weight: "195",
                        squat_max: "345",
                        bench_max: "245",
                        deadlift_max: "405",
                        ai_name: "ECHO-P1",
                        ai_personality: "Stoic"
                    });
                }
            }
        };
        checkGuest();
    }, []);



    return (
        <div className="min-h-screen bg-[#F5F5F4] flex flex-col items-center justify-center p-6 text-stone-900 font-sans relative overflow-hidden">

            {/* Background Atmosphere */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 -left-20 w-[600px] h-[600px] bg-rose-500/5 blur-[128px] rounded-full" />
                <div className="absolute bottom-1/4 -right-20 w-[600px] h-[600px] bg-rose-500/5 blur-[128px] rounded-full" />
            </div>

            <div className="absolute top-8 right-8 flex items-center gap-4 z-50">
                {isGuest && (
                    <div className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-rose-600">Simulation Mode</span>
                    </div>
                )}
                <button
                    onClick={() => logout()}
                    className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400 hover:text-rose-500 transition-colors flex items-center gap-2"
                    type="button"
                >
                    {isGuest ? "Exit Preview" : "Start Over"}
                </button>
            </div>

            <div className="w-full max-w-xl relative z-10">
                {/* Calibration Progress */}
                <div className="flex gap-2 mb-16 justify-center">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="relative w-12 h-1.5">
                            <div className="absolute inset-0 bg-stone-200 rounded-full" />
                            <motion.div
                                initial={false}
                                animate={{ width: i <= step ? "100%" : "0%" }}
                                className="absolute inset-0 bg-rose-600 rounded-full shadow-[0_4px_12px_rgba(225,29,72,0.2)]"
                            />
                        </div>
                    ))}
                </div>

                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        // Only allow form submission on final step
                        if (step !== 5) {
                            return;
                        }
                        // On step 5, let the server action handle it
                        const formData = new FormData(e.currentTarget);
                        await updateOnboardingData(formData);
                    }}
                    className="relative"
                >
                    {/* Hidden inputs to persist all form data across steps */}
                    <input type="hidden" name="units" value={units} />
                    <input type="hidden" name="full_name" value={formState.full_name} />
                    <input type="hidden" name="height_ft" value={formState.height_ft} />
                    <input type="hidden" name="height_in" value={formState.height_in} />
                    <input type="hidden" name="height_cm" value={formState.height_cm} />
                    <input type="hidden" name="weight" value={formState.weight} />
                    <input type="hidden" name="squat_max" value={formState.squat_max} />
                    <input type="hidden" name="bench_max" value={formState.bench_max} />
                    <input type="hidden" name="deadlift_max" value={formState.deadlift_max} />
                    <input type="hidden" name="ai_name" value={formState.ai_name} />
                    <input type="hidden" name="ai_personality" value={formState.ai_personality} />

                    <AnimatePresence mode="wait">

                        {/* STEP 1: IDENTITY */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -30 }}
                                className="space-y-10"
                            >
                                <div className="text-center space-y-6">
                                    <div className="relative mx-auto w-20 h-20">
                                        <div className="absolute inset-0 bg-rose-500/20 blur-2xl rounded-full animate-pulse" />
                                        <div className="relative w-full h-full bg-white rounded-[28px] flex items-center justify-center border border-black/[0.03] shadow-xl">
                                            <User size={32} className="text-stone-900" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h1 className="text-5xl font-serif text-stone-900 tracking-tight">Identity.</h1>
                                        <p className="text-stone-500 text-lg font-light italic">How should the Pulse Engine address you?</p>
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-black/[0.03] group focus-within:border-rose-500/20 transition-all flex items-center gap-6 relative">
                                    <div className="flex-1">
                                        <label className="text-[10px] uppercase font-bold text-stone-400 tracking-[0.3em] block mb-2">Athlete Designation</label>
                                        <input
                                            type="text"
                                            placeholder="Enter your name"
                                            value={formState.full_name}
                                            onChange={(e) => updateField('full_name', e.target.value)}
                                            readOnly={isGuest}
                                            className="w-full bg-transparent text-3xl font-serif text-stone-900 outline-none placeholder:text-stone-200"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if (formState.full_name.trim()) {
                                                        setStep(2);
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="w-full bg-stone-900 text-white h-20 rounded-3xl font-bold text-lg mt-4 flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-[0.98] shadow-xl shadow-stone-900/10"
                                >
                                    Proceed to Units <ChevronRight size={20} />
                                </button>
                            </motion.div>
                        )}

                        {/* STEP 2: MEASUREMENT PROTOCOL */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -30 }}
                                className="space-y-10"
                            >
                                <div className="text-center space-y-2">
                                    <h2 className="text-4xl font-serif text-stone-900 italic">Measurement Protocol</h2>
                                    <p className="text-stone-400 text-[10px] uppercase tracking-[0.3em] font-bold">Standardize your biometric data</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {(['imperial', 'metric'] as const).map((mode) => (
                                        <button
                                            key={mode}
                                            type="button"
                                            disabled={isGuest}
                                            onClick={() => setUnits(mode)}
                                            className={`
                                                relative p-10 rounded-[32px] border transition-all flex flex-col items-center gap-4 text-center
                                                ${units === mode
                                                    ? "bg-white border-rose-500/30 shadow-xl shadow-black/5"
                                                    : "bg-transparent border-transparent hover:bg-black/[0.02]"
                                                }
                                                ${isGuest && units !== mode ? "opacity-40 grayscale" : ""}
                                            `}
                                        >
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${units === mode ? "bg-rose-500/10 text-rose-600" : "bg-stone-100 text-stone-400"}`}>
                                                <Globe size={28} />
                                            </div>
                                            <div>
                                                <span className="text-xl font-serif text-stone-900 block capitalize">{mode}</span>
                                                <span className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">
                                                    {mode === 'imperial' ? 'lb / ft' : 'kg / cm'}
                                                </span>
                                            </div>
                                            {units === mode && (
                                                <motion.div layoutId="unit-active" className="absolute top-4 right-4 text-rose-600">
                                                    <CheckCircle2 size={20} />
                                                </motion.div>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setStep(3)}
                                    className="w-full bg-stone-900 text-white h-20 rounded-3xl font-bold text-lg mt-4 flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-[0.98]"
                                >
                                    Calibrate Physicals <ChevronRight size={20} />
                                </button>
                            </motion.div>
                        )}

                        {/* STEP 3: PHYSICAL CALIBRATION */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -30 }}
                                className="space-y-10"
                            >
                                <div className="text-center space-y-2">
                                    <h2 className="text-4xl font-serif text-stone-900 italic">Physical Baseline</h2>
                                    <p className="text-stone-400 text-[10px] uppercase tracking-[0.3em] font-bold">Required for biometric normalization</p>
                                </div>

                                <div className="space-y-4">
                                    {/* Height Input */}
                                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-black/[0.03] group transition-all flex items-center gap-6 relative">
                                        <div className="w-14 h-14 bg-stone-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
                                            <Ruler size={28} />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[10px] uppercase font-bold text-stone-400 tracking-[0.3em] block mb-1">
                                                Height {units === 'imperial' ? '(ft / in)' : '(cm)'}
                                            </label>

                                            {units === 'imperial' ? (
                                                <div className="flex items-baseline gap-4">
                                                    <div className="flex items-baseline gap-2">
                                                        <input
                                                            type="number"
                                                            placeholder="6"
                                                            value={formState.height_ft}
                                                            onChange={(e) => updateField('height_ft', e.target.value)}
                                                            readOnly={isGuest}
                                                            className="w-12 bg-transparent text-3xl font-serif text-stone-900 outline-none placeholder:text-stone-200"
                                                        />
                                                        <span className="text- stone-400 text-sm italic">ft</span>
                                                    </div>
                                                    <div className="flex items-baseline gap-2">
                                                        <input
                                                            type="number"
                                                            placeholder="2"
                                                            value={formState.height_in}
                                                            onChange={(e) => updateField('height_in', e.target.value)}
                                                            readOnly={isGuest}
                                                            className="w-12 bg-transparent text-3xl font-serif text-stone-900 outline-none placeholder:text-stone-200"
                                                        />
                                                        <span className="text-stone-400 text-sm italic">in</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <input
                                                    type="number"
                                                    placeholder="188"
                                                    value={formState.height_cm}
                                                    onChange={(e) => updateField('height_cm', e.target.value)}
                                                    readOnly={isGuest}
                                                    className="w-full bg-transparent text-3xl font-serif text-stone-900 outline-none placeholder:text-stone-200"
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* Weight Input */}
                                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-black/[0.03] group transition-all flex items-center gap-6 relative">
                                        <div className="w-14 h-14 bg-stone-50 text-stone-900 rounded-2xl flex items-center justify-center shrink-0">
                                            <Weight size={28} />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[10px] uppercase font-bold text-stone-400 tracking-[0.3em] block mb-1">
                                                Weight ({units === 'imperial' ? 'lbs' : 'kg'})
                                            </label>
                                            <input
                                                type="number"
                                                placeholder={units === 'imperial' ? "195" : "88"}
                                                value={formState.weight}
                                                onChange={(e) => updateField('weight', e.target.value)}
                                                readOnly={isGuest}
                                                className="w-full bg-transparent text-3xl font-serif text-stone-900 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-stone-200"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setStep(4)}
                                    className="w-full bg-stone-900 text-white h-20 rounded-3xl font-bold text-lg mt-4 flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-[0.98]"
                                >
                                    Strength Benchmarks <ChevronRight size={20} />
                                </button>
                            </motion.div>
                        )}

                        {/* STEP 4: STRENGTH BENCHMARKS */}
                        {step === 4 && (
                            <motion.div
                                key="step4"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -30 }}
                                className="space-y-10"
                            >
                                <div className="text-center space-y-2">
                                    <h2 className="text-4xl font-serif text-stone-900 italic">Structural Integrity</h2>
                                    <p className="text-stone-400 text-[10px] uppercase tracking-[0.3em] font-bold">Initial load capacity calibration (1RM)</p>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {[
                                        { key: 'squat_max', label: 'Back Squat' },
                                        { key: 'bench_max', label: 'Bench Press' },
                                        { key: 'deadlift_max', label: 'Deadlift' }
                                    ].map((field) => (
                                        <div key={field.key} className="bg-white p-8 rounded-[40px] shadow-sm border border-black/[0.03] group transition-all flex items-center gap-6">
                                            <div className="w-14 h-14 bg-stone-50 text-rose-500 rounded-2xl flex items-center justify-center shrink-0">
                                                <Dumbbell size={28} />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-[10px] uppercase font-bold text-stone-400 tracking-[0.3em] block mb-1">{field.label} ({units === 'imperial' ? 'lbs' : 'kg'})</label>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    value={formState[field.key as keyof typeof formState]}
                                                    onChange={(e) => updateField(field.key, e.target.value)}
                                                    readOnly={isGuest}
                                                    className="w-full bg-transparent text-3xl font-serif text-stone-900 outline-none placeholder:text-stone-200"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setStep(5)}
                                    className="w-full bg-stone-900 text-white h-20 rounded-3xl font-bold text-lg mt-4 flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-[0.98]"
                                >
                                    AI Interface Config <ChevronRight size={20} />
                                </button>
                            </motion.div>
                        )}

                        {/* STEP 5: AI INTELLIGENCE */}
                        {step === 5 && (
                            <motion.div
                                key="step5"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -30 }}
                                className="space-y-10"
                            >
                                <div className="text-center space-y-2">
                                    <h2 className="text-4xl font-serif text-stone-900 italic">Pulse Intelligence</h2>
                                    <p className="text-stone-400 text-[10px] uppercase tracking-[0.3em] font-bold">Configure your digital training partner</p>
                                </div>

                                <div className="space-y-8">
                                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-black/[0.03] group transition-all flex items-center gap-6">
                                        <div className="w-14 h-14 bg-stone-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
                                            <Bot size={28} />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[10px] uppercase font-bold text-stone-400 tracking-[0.3em] block mb-1">Agent Designation</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. ECHO-P1"
                                                value={formState.ai_name}
                                                onChange={(e) => updateField('ai_name', e.target.value)}
                                                readOnly={isGuest}
                                                className="w-full bg-transparent text-3xl font-serif text-stone-900 outline-none placeholder:text-stone-200"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] uppercase font-bold text-stone-400 tracking-[0.3em] block px-4">Cognitive Persona</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['Stoic', 'Motivational', 'Clinical', 'Direct'].map((persona) => (
                                                <label key={persona} className={`
                                                    p-6 rounded-[28px] border transition-all cursor-pointer flex items-center justify-center gap-3
                                                    ${formState.ai_personality === persona ? 'bg-rose-600 border-rose-600 text-white' : 'bg-white border-black/[0.03]'}
                                                    active:outline-none focus-within:ring-2 focus-within:ring-rose-500/20
                                                    ${isGuest ? 'cursor-default' : 'hover:border-rose-500/20'}
                                                `}>
                                                    <input
                                                        type="radio"
                                                        value={persona}
                                                        className="peer sr-only"
                                                        checked={formState.ai_personality === persona}
                                                        onChange={() => updateField('ai_personality', persona)}
                                                        disabled={isGuest}
                                                    />
                                                    <Sparkles size={16} className="opacity-40" />
                                                    <span className="text-sm font-bold uppercase tracking-widest">{persona}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-rose-600 text-white h-20 rounded-[32px] font-bold text-lg mt-4 flex items-center justify-center gap-3 shadow-2xl shadow-rose-600/20 hover:bg-rose-500 transition-all active:scale-[0.98]"
                                >
                                    {isGuest ? "Finalize Preview" : "Complete Synchronization"} <Activity size={20} className="animate-pulse" />
                                </button>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </form>

            </div>

            {/* Footer Subtle Branding */}
            <div className="fixed bottom-12 text-center opacity-20">
                <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-stone-400 select-none">Live by the Pulse.</p>
            </div>
        </div>
    );
}
