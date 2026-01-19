"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { X, Moon, Activity } from "lucide-react";
import { useState } from "react";

export interface PreFlightData {
    sleep: number;
    soreness: "none" | "low" | "high";
}

interface PreFlightProps {
    isOpen: boolean;
    onClose: () => void;
    onReady: (data: PreFlightData) => void;
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
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[200]"
                    />
                </Dialog.Overlay>
                <Dialog.Content asChild>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-[50%] top-[50%] z-[210] max-h-[calc(100vh-10rem)] mt-10 w-[95vw] max-w-[480px] translate-x-[-50%] translate-y-[-50%] rounded-[48px] bg-card border border-border p-10 shadow-2xl focus:outline-none overflow-auto"
                    >
                        {/* Pulse Background Accent */}
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                        <div className="flex justify-between items-start mb-10 relative z-10">
                            <div>
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.3em] mb-2 block">System Readiness</span>
                                <Dialog.Title className="text-4xl font-serif text-foreground italic">Pre-Flight</Dialog.Title>
                            </div>
                            <button
                                onClick={onClose}
                                className="h-12 w-12 flex items-center justify-center rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground transition-colors border border-border"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-10 relative z-10">
                            {/* 1. Sleep Slider */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-baseline">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <Moon size={14} className="text-primary/40" /> Recovered Sleep
                                    </label>
                                    <span className="text-3xl font-serif text-foreground italic">{sleep}h</span>
                                </div>
                                <input
                                    type="range"
                                    min="3" max="10" step="0.5"
                                    value={sleep}
                                    onChange={(e) => setSleep(Number(e.target.value))}
                                    className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Activity size={14} className="text-primary/40" /> Fatigue Spectrum
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {(["none", "low", "high"] as const).map((level) => (
                                        <button
                                            key={level}
                                            onClick={() => setSoreness(level)}
                                            className={`
                                                py-4 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-colors duration-150
                                                ${soreness === level
                                                    ? "bg-primary border-primary text-primary-foreground shadow-2xl shadow-primary/20"
                                                    : "bg-muted border-transparent text-muted-foreground hover:bg-muted/80"}
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
                                className="w-full py-6 rounded-xl bg-foreground text-background font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150 shadow-2xl hover:bg-primary hover:text-primary-foreground shadow-black/10"
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

export interface PostFlightData {
    rpe: number;
    tags: string[];
    notes: string;
}

interface PostFlightProps {
    isOpen: boolean;
    onClose: () => void;
    onFinish: (data: PostFlightData) => void;
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
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[200]"
                    />
                </Dialog.Overlay>
                <Dialog.Content asChild>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-[50%] top-[50%] z-[210] max-h-[calc(100vh-10rem)] mt-10 w-[95vw] max-w-[540px] translate-x-[-50%] translate-y-[-50%] rounded-[48px] bg-card border border-border p-12 shadow-2xl focus:outline-none overflow-auto"
                    >
                        {/* Pulse Background Accent */}
                        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                        <div className="text-center space-y-4 mb-12 relative z-10">
                            <h2 className="text-4xl font-serif text-foreground italic">Session Complete</h2>
                            <p className="text-muted-foreground font-light italic">Calibrate the Coach with your feedback.</p>
                        </div>

                        <div className="space-y-10 relative z-10">
                            {/* 1. Session RPE */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-baseline">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                        Perceived Exertion (RPE)
                                    </label>
                                    <span className="text-3xl font-serif text-foreground italic">{rpe} <span className="text-sm font-sans not-italic text-muted-foreground/50">/ 10</span></span>
                                </div>
                                <input
                                    type="range"
                                    min="1" max="10"
                                    value={rpe}
                                    onChange={(e) => setRpe(Number(e.target.value))}
                                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                            </div>

                            {/* 2. Tags */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Subjective Markers</label>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => toggleTag(tag)}
                                            className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-colors duration-150 ${selectedTags.includes(tag)
                                                ? "bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20"
                                                : "bg-card text-muted-foreground border-border hover:border-foreground/20"
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
                                className="w-full h-32 bg-muted/50 border border-border rounded-xl p-6 text-sm text-foreground resize-none focus:bg-card focus:ring-4 focus:ring-primary/5 outline-none font-serif italic shadow-inner placeholder:text-muted-foreground"
                            />

                            {/* 4. Complete button */}
                            <button
                                onClick={() => onFinish({ rpe, tags: selectedTags, notes })}
                                className="w-full py-6 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:bg-foreground hover:text-background transition-colors duration-150 shadow-2xl shadow-primary/20"
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
