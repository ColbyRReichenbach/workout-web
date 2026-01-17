"use client";

import { motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { Check, Dumbbell, Scale, Activity, Zap, User, Target, TrendingUp, HeartPulse } from "lucide-react";
import { TiltCard } from "@/components/TiltCard";

const PHASE_RANGES = {
    1: { min: 1, max: 8, label: "Structural Integrity" },
    2: { min: 9, max: 20, label: "Strength & Threshold" },
    3: { min: 21, max: 32, label: "Peak Power" },
    4: { min: 33, max: 36, label: "The Washout" },
    5: { min: 37, max: 52, label: "Recalibration" }
};

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [form, setForm] = useState({
        weight_lbs: "",
        squat_max: "",
        bench_max: "",
        deadlift_max: "",
        mile_time: "",
        k5_time: "",
        sprint_400m: "",
        current_week: 1,
        current_phase: 1,
    });

    const supabase = createClient();

    // Effect to keep week in range when phase changes
    useEffect(() => {
        const range = (PHASE_RANGES as any)[form.current_phase];
        if (range) {
            if (form.current_week < range.min || form.current_week > range.max) {
                setForm(prev => ({ ...prev, current_week: range.min }));
            }
        }
    }, [form.current_phase]);

    // Helpers
    const secondsToTime = (seconds: number | null) => {
        if (!seconds) return "";
        const m = Math.floor(seconds / 60);
        const s = Math.round(seconds % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const timeToSeconds = (timeStr: string) => {
        if (!timeStr || !timeStr.includes(":")) return parseFloat(timeStr) * 60 || 0;
        const [m, s] = timeStr.split(":").map(Number);
        return (m * 60) + (s || 0);
    };

    useEffect(() => {
        async function fetchProfile() {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .single();

            if (data) {
                setProfile(data);
                setForm({
                    weight_lbs: data.weight_lbs?.toString() || "",
                    squat_max: data.squat_max?.toString() || "",
                    bench_max: data.bench_max?.toString() || "",
                    deadlift_max: data.deadlift_max?.toString() || "",
                    mile_time: secondsToTime(data.mile_time_sec),
                    k5_time: secondsToTime(data.k5_time_sec),
                    sprint_400m: secondsToTime(data.sprint_400m_sec),
                    current_week: data.current_week || 1,
                    current_phase: data.current_phase || 1,
                });
            }
            setLoading(false);
        }
        fetchProfile();
    }, []);

    const handleSubmit = async () => {
        if (!profile?.id) {
            alert("Profile not loaded. Please refresh the page.");
            return;
        }

        setLoading(true);

        const updateData = {
            weight_lbs: parseFloat(form.weight_lbs) || null,
            squat_max: parseFloat(form.squat_max) || null,
            bench_max: parseFloat(form.bench_max) || null,
            deadlift_max: parseFloat(form.deadlift_max) || null,
            mile_time_sec: form.mile_time ? timeToSeconds(form.mile_time) : null,
            k5_time_sec: form.k5_time ? timeToSeconds(form.k5_time) : null,
            sprint_400m_sec: form.sprint_400m ? timeToSeconds(form.sprint_400m) : null,
            current_week: form.current_week,
            current_phase: form.current_phase,
        };

        const { error } = await supabase
            .from("profiles")
            .update(updateData)
            .eq("id", profile.id);

        if (error) {
            console.error("Profile update failed:", error);
            alert(`Save failed: ${error.message}`);
        } else {
            alert("Synchronization complete.");
            const { data } = await supabase.from("profiles").select("*").single();
            if (data) {
                setProfile(data);
                setForm({
                    weight_lbs: data.weight_lbs?.toString() || "",
                    squat_max: data.squat_max?.toString() || "",
                    bench_max: data.bench_max?.toString() || "",
                    deadlift_max: data.deadlift_max?.toString() || "",
                    mile_time: secondsToTime(data.mile_time_sec),
                    k5_time: secondsToTime(data.k5_time_sec),
                    sprint_400m: secondsToTime(data.sprint_400m_sec),
                    current_week: data.current_week || 1,
                    current_phase: data.current_phase || 1,
                });
            }
        }
        setLoading(false);
    }

    if (loading && !profile) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="text-stone-400 font-serif animate-pulse text-xl">Calibrating Pulse Data...</div>
            </div>
        );
    }

    const inputClasses = "w-full bg-stone-50 border border-black/[0.03] rounded-3xl px-6 py-5 text-2xl font-serif focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-stone-300 text-stone-900";

    return (
        <div className="max-w-7xl mx-auto space-y-16">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                <div className="space-y-4">
                    <span className="text-primary font-bold tracking-[0.3em] text-[10px] uppercase block">Personnel Baseline</span>
                    <h1 className="font-serif text-6xl md:text-8xl text-stone-900 leading-[0.9]">Athlete Data</h1>
                    <p className="text-stone-500 text-xl font-light italic max-w-xl">
                        Your physical metrics drive the adaptive weighting engine. Keep these updated for accurate pulse targets.
                    </p>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-primary text-white font-bold text-lg px-12 py-6 rounded-full shadow-2xl shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center gap-4 disabled:opacity-50"
                >
                    {loading ? "Syncing..." : <><Check size={24} strokeWidth={3} /> Sync Baseline</>}
                </motion.button>
            </header>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 auto-rows-auto">

                {/* 1. Identity & Weight (Medium) */}
                <TiltCard className="lg:col-span-4 rounded-[40px] p-10 flex flex-col justify-between group overflow-hidden" glowColor="shadow-red-500/5">
                    <div className="absolute -right-12 -top-12 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none text-primary">
                        <User size={300} strokeWidth={1} />
                    </div>

                    <div>
                        <div className="w-16 h-16 rounded-3xl bg-primary/5 flex items-center justify-center text-primary mb-8 transition-transform group-hover:scale-110">
                            <Scale size={32} />
                        </div>
                        <h2 className="text-3xl font-serif text-stone-900 mb-2">Biometrics</h2>
                        <p className="text-stone-400 text-sm font-light">Physical displacement data.</p>
                    </div>

                    <div className="mt-12 space-y-6 relative z-10">
                        <div className="relative group/field">
                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest absolute -top-2 left-6 bg-white px-2 z-10 transition-colors group-hover/field:text-primary">Bodyweight</label>
                            <input
                                type="number"
                                value={form.weight_lbs}
                                onChange={(e) => setForm({ ...form, weight_lbs: e.target.value })}
                                className={inputClasses}
                                placeholder="0"
                            />
                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-stone-300 font-serif text-lg italic">lb</span>
                        </div>
                        <div className="p-6 rounded-3xl bg-stone-50 border border-black/[0.01] flex items-center justify-between">
                            <span className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">Height Spectrum</span>
                            <span className="text-stone-900 font-serif text-2xl italic">{profile?.height || "6'1\""}</span>
                        </div>
                    </div>
                </TiltCard>

                {/* 2. Program Tracking (Medium) */}
                <TiltCard className="lg:col-span-4 rounded-[40px] p-10 flex flex-col group overflow-hidden" glowColor="shadow-primary/10">
                    <div className="absolute -right-12 -bottom-12 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none text-primary">
                        <Activity size={300} strokeWidth={1} />
                    </div>

                    <div>
                        <div className="w-16 h-16 rounded-3xl bg-primary/5 flex items-center justify-center text-primary mb-8 transition-transform group-hover:scale-110">
                            <Target size={32} />
                        </div>
                        <h2 className="text-3xl font-serif text-stone-900 mb-2">Program Sync</h2>
                        <p className="text-stone-400 text-sm font-light">Align the interface with your master plan.</p>
                    </div>

                    <div className="mt-12 space-y-8 relative z-10">
                        <div className="space-y-4">
                            <label className="text-[10px] font-bold text-stone-300 uppercase tracking-widest px-2">
                                {(PHASE_RANGES as any)[form.current_phase]?.label}
                            </label>
                            <div className="grid grid-cols-5 gap-2">
                                {[1, 2, 3, 4, 5].map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setForm({ ...form, current_phase: p })}
                                        className={`py-3 rounded-2xl border text-sm font-bold transition-all ${form.current_phase === p
                                            ? "bg-primary border-primary text-white shadow-xl shadow-primary/20"
                                            : "bg-white border-black/5 text-stone-400 hover:border-black/20"
                                            }`}
                                    >
                                        P{p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-2">
                                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Active Week</label>
                                <span className="text-stone-900 font-serif text-xl italic">Week {form.current_week}</span>
                            </div>
                            <input
                                type="range"
                                min={(PHASE_RANGES as any)[form.current_phase]?.min || 1}
                                max={(PHASE_RANGES as any)[form.current_phase]?.max || 52}
                                value={form.current_week}
                                onChange={(e) => setForm({ ...form, current_week: parseInt(e.target.value) })}
                                className="w-full accent-primary h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between px-2">
                                <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">Start: {(PHASE_RANGES as any)[form.current_phase]?.min}</span>
                                <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">End: {(PHASE_RANGES as any)[form.current_phase]?.max}</span>
                            </div>
                        </div>
                    </div>
                </TiltCard>

                {/* 3. Strength Matrix (Large) */}
                <TiltCard className="lg:col-span-4 rounded-[40px] p-10 flex flex-col group" glowColor="shadow-primary/10">
                    <div className="absolute -right-12 -bottom-12 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none text-primary">
                        <HeartPulse size={400} strokeWidth={1} />
                    </div>

                    <div className="flex flex-col justify-between h-full mb-16 gap-10">
                        <div>
                            <div className="w-16 h-16 rounded-3xl bg-primary/5 flex items-center justify-center text-primary mb-8 transition-transform group-hover:scale-110">
                                <TrendingUp size={32} />
                            </div>
                            <h2 className="text-3xl font-serif text-stone-900 mb-2">Power Benchmarks</h2>
                        </div>

                        <div className="space-y-6">
                            {[
                                { label: "Squat", key: "squat_max" },
                                { label: "Bench", key: "bench_max" },
                                { label: "Deadlift", key: "deadlift_max" },
                            ].map((field) => (
                                <div key={field.key} className="relative group/field">
                                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest absolute -top-2 left-6 bg-white px-2 z-10 transition-colors group-hover/field:text-primary">{field.label}</label>
                                    <input
                                        type="number"
                                        value={(form as any)[field.key]}
                                        onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                                        className={inputClasses}
                                        placeholder="0"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </TiltCard>

                {/* 4. Endurance Benchmarks (Extra Wide) */}
                <TiltCard className="lg:col-span-12 rounded-[40px] p-10 flex flex-col md:flex-row md:items-center justify-between group overflow-hidden" glowColor="shadow-primary/5">
                    <div className="absolute right-1/4 -top-20 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none text-primary">
                        <Activity size={300} strokeWidth={1} />
                    </div>

                    <div className="md:w-1/3 mb-10 md:mb-0">
                        <div className="flex items-center gap-6 mb-2">
                            <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary transition-transform group-hover:rotate-12">
                                <Zap size={28} />
                            </div>
                            <h2 className="text-3xl font-serif text-stone-900">Endurance Pulse</h2>
                        </div>
                        <p className="text-stone-400 text-sm font-light italic">Quantifying your heart's efficiency.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1">
                        {[
                            { label: "Mile Run", key: "mile_time" },
                            { label: "5k Spectrum", key: "k5_time" },
                            { label: "400m Dash", key: "sprint_400m" },
                        ].map((field) => (
                            <div key={field.key} className="relative group/field">
                                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest absolute -top-2 left-6 bg-white px-2 z-10 transition-colors group-hover/field:text-primary">{field.label}</label>
                                <input
                                    type="text"
                                    placeholder="mm:ss"
                                    value={(form as any)[field.key]}
                                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                                    className={inputClasses}
                                />
                            </div>
                        ))}
                    </div>
                </TiltCard>

            </div>

            {/* Footer Inspiration */}
            <p className="text-center text-stone-300 text-xs font-light mt-12 mb-8 lowercase tracking-[0.2em]">
                Pulse Architecture v2.0 &bull; Private Athlete Terminal
            </p>
        </div>
    );
}
