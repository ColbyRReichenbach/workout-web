"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X, Moon, ThumbsUp, ThumbsDown, Battery, Activity, ShieldCheck, HeartPulse } from "lucide-react";
import { useState } from "react";

interface PreFlightProps {
    isOpen: boolean;
    onClose: () => void;
    onReady: (data: any) => void;
}

export function PreFlightModal({ isOpen, onClose, onReady }: PreFlightProps) {
    const [sleep, setSleep] = useState(7);
    const [soreness, setSoreness] = useState<"none" | "low" | "high">("none");

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay asChild>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-stone-900/10 backdrop-blur-xl z-[200]"
                    />
                </Dialog.Overlay>
                <Dialog.Content asChild>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-[50%] top-[50%] z-[210] max-h-[90vh] w-[95vw] max-w-[480px] translate-x-[-50%] translate-y-[-50%] rounded-[48px] bg-white border border-black/5 p-10 shadow-2xl focus:outline-none overflow-hidden"
                    >
                        {/* Pulse Background Accent */}
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                        <div className="flex justify-between items-start mb-10 relative z-10">
                            <div>
                                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-[0.3em] mb-2 block">System Readiness</span>
                                <Dialog.Title className="text-4xl font-serif text-stone-900 italic">Pre-Flight</Dialog.Title>
                            </div>
                            <button
                                onClick={onClose}
                                className="h-12 w-12 flex items-center justify-center rounded-2xl bg-stone-50 hover:bg-stone-100 text-stone-400 transition-colors border border-black/[0.02]"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-10 relative z-10">
                            {/* 1. Sleep Slider */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-baseline">
                                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                                        <Moon size={14} className="text-primary/40" /> Recovered Sleep
                                    </label>
                                    <span className="text-3xl font-serif text-stone-900 italic">{sleep}h</span>
                                </div>
                                <input
                                    type="range"
                                    min="3" max="10" step="0.5"
                                    value={sleep}
                                    onChange={(e) => setSleep(Number(e.target.value))}
                                    className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                            </div>

                            {/* 2. Soreness Selector */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                                    <Activity size={14} className="text-primary/40" /> Fatigue Spectrum
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {["none", "low", "high"].map((level) => (
                                        <button
                                            key={level}
                                            onClick={() => setSoreness(level as any)}
                                            className={`
                                                py-4 rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all
                                                ${soreness === level
                                                    ? "bg-primary border-primary text-white shadow-2xl shadow-primary/20"
                                                    : "bg-stone-50 border-transparent text-stone-400 hover:bg-stone-100"}
                                            `}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 3. Submit */}
                            <button
                                onClick={() => onReady({ sleep, soreness })}
                                className="w-full py-6 rounded-[24px] bg-stone-900 text-white font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl hover:bg-primary shadow-black/10"
                            >
                                Initiate Session
                            </button>
                        </div>

                    </motion.div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

interface PostFlightProps {
    isOpen: boolean;
    onClose: () => void;
    onFinish: (data: any) => void;
}

export function PostFlightModal({ isOpen, onClose, onFinish }: PostFlightProps) {
    const [rpe, setRpe] = useState(7);
    const [notes, setNotes] = useState("");
    const tags = ["Felt Heavy", "Great Pump", "Low Energy", "Joint Stress", "Euphoric"];
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay asChild>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-stone-900/20 backdrop-blur-xl z-[200]"
                    />
                </Dialog.Overlay>
                <Dialog.Content asChild>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-[50%] top-[50%] z-[210] max-h-[90vh] w-[95vw] max-w-[540px] translate-x-[-50%] translate-y-[-50%] rounded-[48px] bg-white border border-black/5 p-12 shadow-2xl focus:outline-none overflow-hidden"
                    >
                        {/* Pulse Background Accent */}
                        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                        <div className="text-center space-y-4 mb-12 relative z-10">
                            <h2 className="text-4xl font-serif text-stone-900 italic">Session Complete</h2>
                            <p className="text-stone-400 font-light italic">Calibrate the Coach with your feedback.</p>
                        </div>

                        <div className="space-y-10 relative z-10">
                            {/* 1. Session RPE */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-baseline">
                                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                                        Perceived Exertion (RPE)
                                    </label>
                                    <span className="text-3xl font-serif text-stone-900 italic">{rpe} <span className="text-sm font-sans not-italic text-stone-300">/ 10</span></span>
                                </div>
                                <input
                                    type="range"
                                    min="1" max="10"
                                    value={rpe}
                                    onChange={(e) => setRpe(Number(e.target.value))}
                                    className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                            </div>

                            {/* 2. Tags */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Subjective Markers</label>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => toggleTag(tag)}
                                            className={`px-5 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest border transition-all ${selectedTags.includes(tag)
                                                ? "bg-primary text-white border-primary shadow-xl shadow-primary/20"
                                                : "bg-white text-stone-400 border-black/5 hover:border-black/20"
                                                }`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 3. Free Text */}
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Debriefing notes..."
                                className="w-full h-32 bg-stone-50/50 border border-black/[0.02] rounded-[24px] p-6 text-sm text-stone-900 resize-none focus:bg-white focus:ring-4 focus:ring-primary/5 outline-none font-serif italic shadow-inner"
                            />

                            {/* 4. Complete button */}
                            <button
                                onClick={() => onFinish({ rpe, tags: selectedTags, notes })}
                                className="w-full py-6 rounded-[24px] bg-primary text-white font-bold text-lg hover:bg-stone-900 transition-all shadow-2xl shadow-primary/20"
                            >
                                Synchronize Log
                            </button>
                        </div>

                    </motion.div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
