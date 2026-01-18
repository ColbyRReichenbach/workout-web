"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Ruler, Weight, Activity, Heart, ChevronRight, User, Globe, Bot, Dumbbell, Sparkles, CheckCircle2 } from "lucide-react";
import { updateOnboardingData } from "@/app/actions/user";
import { logout } from "@/app/actions/auth";

export default function OnboardingPage() {
    const [step, setStep] = useState(1);
    const [isGuest, setIsGuest] = useState(false);
    const [units, setUnits] = useState<"imperial" | "metric">("imperial");

    useEffect(() => {
        const checkGuest = () => {
            if (typeof document !== "undefined") {
                setIsGuest(document.cookie.includes("guest-mode=true"));
                if (document.cookie.includes("guest-mode=true")) {
                    setUnits("imperial");
                }
            }
        };
        checkGuest();
    }, []);

    const totalSteps = 5;

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

                <form action={async (formData) => {
                    await updateOnboardingData(formData);
                }} className="relative">
                    <input type="hidden" name="units" value={units} />
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
                                            name="full_name"
                                            type="text"
                                            placeholder="Enter your name"
                                            defaultValue={isGuest ? "Colby Reichenbach" : ""}
                                            readOnly={isGuest}
                                            className="w-full bg-transparent text-3xl font-serif text-stone-900 outline-none placeholder:text-stone-200"
                                            autoFocus
                                            required
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
                                    {['imperial', 'metric'].map((mode) => (
                                        <button
                                            key={mode}
                                            type="button"
                                            disabled={isGuest}
                                            onClick={() => setUnits(mode as any)}
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
                                                            name="height_ft"
                                                            type="number"
                                                            placeholder="6"
                                                            defaultValue={isGuest ? "6" : ""}
                                                            readOnly={isGuest}
                                                            className="w-12 bg-transparent text-3xl font-serif text-stone-900 outline-none placeholder:text-stone-200"
                                                        />
                                                        <span className="text- stone-400 text-sm italic">ft</span>
                                                    </div>
                                                    <div className="flex items-baseline gap-2">
                                                        <input
                                                            name="height_in"
                                                            type="number"
                                                            placeholder="2"
                                                            defaultValue={isGuest ? "2" : ""}
                                                            readOnly={isGuest}
                                                            className="w-12 bg-transparent text-3xl font-serif text-stone-900 outline-none placeholder:text-stone-200"
                                                        />
                                                        <span className="text-stone-400 text-sm italic">in</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <input
                                                    name="height_cm"
                                                    type="number"
                                                    placeholder="188"
                                                    defaultValue={isGuest ? "188" : ""}
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
                                                name="weight"
                                                type="number"
                                                placeholder={units === 'imperial' ? "195" : "88"}
                                                defaultValue={isGuest ? (units === 'imperial' ? 195 : 88) : ""}
                                                readOnly={isGuest}
                                                className="w-full bg-transparent text-3xl font-serif text-stone-900 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-stone-200"
                                                required
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
                                        { key: 'squat_max', label: 'Back Squat', value: 405 },
                                        { key: 'bench_max', label: 'Bench Press', value: 315 },
                                        { key: 'deadlift_max', label: 'Deadlift', value: 495 }
                                    ].map((field) => (
                                        <div key={field.key} className="bg-white p-8 rounded-[40px] shadow-sm border border-black/[0.03] group transition-all flex items-center gap-6">
                                            <div className="w-14 h-14 bg-stone-50 text-rose-500 rounded-2xl flex items-center justify-center shrink-0">
                                                <Dumbbell size={28} />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-[10px] uppercase font-bold text-stone-400 tracking-[0.3em] block mb-1">{field.label} ({units === 'imperial' ? 'lbs' : 'kg'})</label>
                                                <input
                                                    name={field.key}
                                                    type="number"
                                                    placeholder="0"
                                                    defaultValue={isGuest ? (units === 'imperial' ? field.value : Math.round(field.value * 0.453592)) : ""}
                                                    readOnly={isGuest}
                                                    className="w-full bg-transparent text-3xl font-serif text-stone-900 outline-none placeholder:text-stone-200"
                                                    required
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
                                                name="ai_name"
                                                type="text"
                                                placeholder="e.g. ECHO-P1"
                                                defaultValue={isGuest ? "ECHO-P1" : ""}
                                                readOnly={isGuest}
                                                className="w-full bg-transparent text-3xl font-serif text-stone-900 outline-none placeholder:text-stone-200"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] uppercase font-bold text-stone-400 tracking-[0.3em] block px-4">Cognitive Persona</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['Stoic', 'Motivational', 'Clinical', 'Direct'].map((persona) => (
                                                <label key={persona} className={`
                                                    p-6 rounded-[28px] border transition-all cursor-pointer flex items-center justify-center gap-3
                                                    has-[:checked]:bg-rose-600 has-[:checked]:border-rose-600 has-[:checked]:text-white
                                                    active:outline-none focus-within:ring-2 focus-within:ring-rose-500/20
                                                    ${isGuest ? 'cursor-default' : 'hover:border-rose-500/20 bg-white'}
                                                `}>
                                                    <input
                                                        type="radio"
                                                        name="ai_personality"
                                                        value={persona}
                                                        className="peer sr-only"
                                                        defaultChecked={isGuest ? persona === 'Stoic' : persona === 'Clinical'}
                                                        disabled={isGuest}
                                                        required
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
