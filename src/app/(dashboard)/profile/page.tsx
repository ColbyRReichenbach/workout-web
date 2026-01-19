"use client";

import { motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { toDisplayWeight, toStorageWeight, getUnitLabel } from "@/lib/conversions";
import { useEffect, useState } from "react";
import { Check, Scale, Activity, Zap, User, Target, TrendingUp, HeartPulse } from "lucide-react";
import { TiltCard } from "@/components/TiltCard";
import { logout } from "@/app/actions/auth";
import { useSettings } from "@/context/SettingsContext";

import { UserProfile } from "@/lib/types";

interface PhaseRange {
    min: number;
    max: number;
    label: string;
}

const PHASE_RANGES: Record<number, PhaseRange> = {
    1: { min: 1, max: 8, label: "Structural Integrity" },
    2: { min: 9, max: 20, label: "Strength & Threshold" },
    3: { min: 21, max: 32, label: "Peak Power" },
    4: { min: 33, max: 36, label: "The Washout" },
    5: { min: 37, max: 52, label: "Recalibration" }
};

interface ProfileFormState {
    weight_lbs: string;
    // Powerlifting Maxes
    squat_max: string;
    bench_max: string;
    deadlift_max: string;
    // Olympic Lift Maxes
    front_squat_max: string;
    clean_jerk_max: string;
    snatch_max: string;
    ohp_max: string;
    // Cardio Benchmarks
    mile_time: string;
    k5_time: string;
    sprint_400m: string;
    row_2k: string;
    row_500m: string;
    ski_1k: string;
    bike_max_watts: string;
    // Training State
    current_week: number;
    current_phase: number;
}

export default function ProfilePage() {
    const { units } = useSettings();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [form, setForm] = useState<ProfileFormState>({
        weight_lbs: "",
        squat_max: "",
        bench_max: "",
        deadlift_max: "",
        front_squat_max: "",
        clean_jerk_max: "",
        snatch_max: "",
        ohp_max: "",
        mile_time: "",
        k5_time: "",
        sprint_400m: "",
        row_2k: "",
        row_500m: "",
        ski_1k: "",
        bike_max_watts: "",
        current_week: 1,
        current_phase: 1,
    });

    const supabase = createClient();

    const handlePhaseChange = (phase: number) => {
        const range = PHASE_RANGES[phase];
        let newWeek = form.current_week;
        if (range) {
            if (newWeek < range.min || newWeek > range.max) {
                newWeek = range.min;
            }
        }
        setForm({ ...form, current_phase: phase, current_week: newWeek });
    };

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

    // Fetch Profile
    useEffect(() => {
        async function fetchProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            let query = supabase.from("profiles").select("*");

            if (user) {
                query = query.eq('id', user.id);
            } else {
                query = query.eq('id', '00000000-0000-0000-0000-000000000001');
            }

            const { data } = await query.single();

            if (data) {
                setProfile(data);
                // Initial form set will happen via the dependency on 'profile' and 'units' below
            }
            setLoading(false);
        }
        fetchProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync Form with Profile and Units (eslint-disable needed for controlled form pattern)
    useEffect(() => {
        if (profile) {
            setForm(prev => ({
                ...prev,
                weight_lbs: toDisplayWeight(profile.weight_lbs, units)?.toString() || "",
                squat_max: toDisplayWeight(profile.squat_max, units)?.toString() || "",
                bench_max: toDisplayWeight(profile.bench_max, units)?.toString() || "",
                deadlift_max: toDisplayWeight(profile.deadlift_max, units)?.toString() || "",
                front_squat_max: toDisplayWeight(profile.front_squat_max, units)?.toString() || "",
                clean_jerk_max: toDisplayWeight(profile.clean_jerk_max, units)?.toString() || "",
                snatch_max: toDisplayWeight(profile.snatch_max, units)?.toString() || "",
                ohp_max: toDisplayWeight(profile.ohp_max, units)?.toString() || "",
                mile_time: secondsToTime(profile.mile_time_sec),
                k5_time: secondsToTime(profile.k5_time_sec),
                sprint_400m: secondsToTime(profile.sprint_400m_sec),
                row_2k: secondsToTime(profile.row_2k_sec),
                row_500m: secondsToTime(profile.row_500m_sec),
                ski_1k: secondsToTime(profile.ski_1k_sec),
                bike_max_watts: profile.bike_max_watts?.toString() || "",
                current_week: profile.current_week || 1,
                current_phase: profile.current_phase || 1,
            }));
        }
    }, [profile, units]);


    const handleSubmit = async () => {
        if (!profile?.id) {
            alert("Profile not loaded. Please refresh the page.");
            return;
        }

        setLoading(true);

        const updateData = {
            weight_lbs: toStorageWeight(form.weight_lbs, units) || null,
            squat_max: toStorageWeight(form.squat_max, units) || null,
            bench_max: toStorageWeight(form.bench_max, units) || null,
            deadlift_max: toStorageWeight(form.deadlift_max, units) || null,
            front_squat_max: toStorageWeight(form.front_squat_max, units) || null,
            clean_jerk_max: toStorageWeight(form.clean_jerk_max, units) || null,
            snatch_max: toStorageWeight(form.snatch_max, units) || null,
            ohp_max: toStorageWeight(form.ohp_max, units) || null,
            mile_time_sec: form.mile_time ? timeToSeconds(form.mile_time) : null,
            k5_time_sec: form.k5_time ? timeToSeconds(form.k5_time) : null,
            sprint_400m_sec: form.sprint_400m ? timeToSeconds(form.sprint_400m) : null,
            row_2k_sec: form.row_2k ? timeToSeconds(form.row_2k) : null,
            row_500m_sec: form.row_500m ? timeToSeconds(form.row_500m) : null,
            ski_1k_sec: form.ski_1k ? timeToSeconds(form.ski_1k) : null,
            bike_max_watts: form.bike_max_watts ? parseFloat(form.bike_max_watts) : null,
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
            // Re-fetch to confirm consistency
            const { data } = await supabase.from("profiles").select("*").eq('id', profile.id).single();
            if (data) setProfile(data);
        }

        setLoading(false);
    }

    if (loading && !profile) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="text-muted-foreground font-serif animate-pulse text-xl">Calibrating Pulse Data...</div>
            </div>
        );
    }

    const inputClasses = "w-full bg-muted/30 border border-border rounded-xl px-6 pt-8 pb-2 text-2xl font-serif focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-muted-foreground/30 text-foreground";

    return (
        <div className="max-w-7xl mx-auto space-y-16">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                <div className="space-y-4">
                    <span className="text-primary font-bold tracking-[0.3em] text-[10px] uppercase block">Personnel Baseline</span>
                    <h1 className="font-serif text-6xl md:text-8xl text-foreground leading-[0.9]">Athlete Data</h1>
                    <p className="text-muted-foreground text-xl font-light italic max-w-xl">
                        Your physical metrics drive the adaptive weighting engine. Keep these updated for accurate pulse targets.
                    </p>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => logout()}
                        className="bg-muted text-muted-foreground font-bold text-lg px-8 py-6 rounded-full hover:bg-muted/80 transition-all"
                    >
                        Sign Out
                    </button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-primary text-primary-foreground font-bold text-lg px-12 py-6 rounded-full shadow-2xl shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center gap-4 disabled:opacity-50"
                    >
                        {loading ? "Syncing..." : <><Check size={24} strokeWidth={3} /> Sync Baseline</>}
                    </motion.button>
                </div>
            </header>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 auto-rows-auto">

                {/* 1. Identity & Weight (Medium) */}
                <TiltCard className="lg:col-span-4 rounded-[48px] p-10 flex flex-col justify-between group overflow-hidden bg-card border-border" glowColor="shadow-red-500/5">
                    <div className="absolute -right-12 -top-12 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none text-primary">
                        <User size={300} strokeWidth={1} />
                    </div>

                    <div>
                        <div className="w-16 h-16 rounded-xl bg-primary/5 flex items-center justify-center text-primary mb-8 transition-transform group-hover:scale-110">
                            <Scale size={32} />
                        </div>
                        <h2 className="text-3xl font-serif text-foreground mb-2">Biometrics</h2>
                        <p className="text-muted-foreground text-sm font-light">Physical displacement data.</p>
                    </div>

                    <div className="mt-12 space-y-6 relative z-10">
                        <div className="relative group/field">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest absolute top-3 left-6 transition-colors group-hover/field:text-primary">
                                Bodyweight ({getUnitLabel(units, 'weight')})
                            </label>
                            <input
                                type="number"
                                value={form.weight_lbs}
                                onChange={(e) => setForm({ ...form, weight_lbs: e.target.value })}
                                className={inputClasses}
                                placeholder="0"
                            />
                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground/50 font-serif text-lg italic">
                                {getUnitLabel(units, 'weight')}
                            </span>
                        </div>
                        <div className="p-6 rounded-xl bg-muted/30 border border-border flex items-center justify-between">
                            <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Height Spectrum</span>
                            <span className="text-foreground font-serif text-2xl italic">{profile?.height || "6'1\""}</span>
                        </div>
                    </div>
                </TiltCard>

                {/* 2. Program Tracking (Medium) */}
                <TiltCard className="lg:col-span-4 rounded-[48px] p-10 flex flex-col group overflow-hidden bg-card border-border" glowColor="shadow-primary/10">
                    <div className="absolute -right-12 -bottom-12 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none text-primary">
                        <Activity size={300} strokeWidth={1} />
                    </div>

                    <div>
                        <div className="w-16 h-16 rounded-xl bg-primary/5 flex items-center justify-center text-primary mb-8 transition-transform group-hover:scale-110">
                            <Target size={32} />
                        </div>
                        <h2 className="text-3xl font-serif text-foreground mb-2">Program Sync</h2>
                        <p className="text-muted-foreground text-sm font-light">Align the interface with your master plan.</p>
                    </div>

                    <div className="mt-12 space-y-8 relative z-10">
                        <div className="space-y-4">
                            <label className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest px-2">
                                {PHASE_RANGES[form.current_phase]?.label}
                            </label>
                            <div className="grid grid-cols-5 gap-2">
                                {[1, 2, 3, 4, 5].map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => handlePhaseChange(p)}
                                        className={`py-3 rounded-xl border text-sm font-bold transition-all ${form.current_phase === p
                                            ? "bg-primary border-primary text-primary-foreground shadow-xl shadow-primary/20"
                                            : "bg-card border-border text-muted-foreground hover:border-foreground/20"
                                            }`}
                                    >
                                        P{p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Week</label>
                                <span className="text-foreground font-serif text-xl italic">Week {form.current_week}</span>
                            </div>
                            <input
                                type="range"
                                min={PHASE_RANGES[form.current_phase]?.min || 1}
                                max={PHASE_RANGES[form.current_phase]?.max || 52}
                                value={form.current_week}
                                onChange={(e) => setForm({ ...form, current_week: parseInt(e.target.value) })}
                                className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between px-2">
                                <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">Start: {PHASE_RANGES[form.current_phase]?.min}</span>
                                <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">End: {PHASE_RANGES[form.current_phase]?.max}</span>
                            </div>
                        </div>
                    </div>
                </TiltCard>

                {/* 3. Strength Matrix (Large) */}
                <TiltCard className="lg:col-span-4 rounded-[48px] p-10 flex flex-col group overflow-hidden bg-card border-border" glowColor="shadow-primary/10">
                    <div className="absolute -right-12 -bottom-12 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none text-primary">
                        <HeartPulse size={400} strokeWidth={1} />
                    </div>

                    <div className="flex flex-col justify-between h-full mb-16 gap-10">
                        <div>
                            <div className="w-16 h-16 rounded-xl bg-primary/5 flex items-center justify-center text-primary mb-8 transition-transform group-hover:scale-110">
                                <TrendingUp size={32} />
                            </div>
                            <h2 className="text-3xl font-serif text-foreground mb-2">Power Benchmarks</h2>
                        </div>

                        <div className="space-y-6">
                            {[
                                { label: "Squat", key: "squat_max" },
                                { label: "Bench", key: "bench_max" },
                                { label: "Deadlift", key: "deadlift_max" },
                            ].map((field) => (
                                <div key={field.key} className="relative group/field">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest absolute top-3 left-6 transition-colors group-hover/field:text-primary">
                                        {field.label} ({getUnitLabel(units, 'weight')})
                                    </label>
                                    <input
                                        type="number"
                                        value={form[field.key as keyof ProfileFormState]}
                                        onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                                        className={inputClasses}
                                        placeholder="0"
                                    />
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground/50 font-serif text-lg italic">
                                        {getUnitLabel(units, 'weight')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </TiltCard>

                {/* 4. Endurance Benchmarks (Extra Wide) */}
                <TiltCard className="lg:col-span-12 rounded-[48px] p-10 flex flex-col md:flex-row md:items-center justify-between group overflow-hidden bg-card border-border" glowColor="shadow-primary/5">
                    <div className="absolute right-1/4 -top-20 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none text-primary">
                        <Activity size={300} strokeWidth={1} />
                    </div>

                    <div className="md:w-1/3 mb-10 md:mb-0">
                        <div className="flex items-center gap-6 mb-2">
                            <div className="w-14 h-14 rounded-xl bg-primary/5 flex items-center justify-center text-primary transition-transform group-hover:rotate-12">
                                <Zap size={28} />
                            </div>
                            <h2 className="text-3xl font-serif text-foreground">Endurance Pulse</h2>
                        </div>
                        <p className="text-muted-foreground text-sm font-light italic">Quantifying your heart&apos;s efficiency.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1">
                        {[
                            { label: "Mile Run", key: "mile_time" },
                            { label: "5k Spectrum", key: "k5_time" },
                            { label: "400m Dash", key: "sprint_400m" },
                        ].map((field) => (
                            <div key={field.key} className="relative group/field">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest absolute top-3 left-6 transition-colors group-hover/field:text-primary">{field.label}</label>
                                <input
                                    type="text"
                                    placeholder="mm:ss"
                                    value={form[field.key as keyof ProfileFormState]}
                                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                                    className={inputClasses}
                                />
                            </div>
                        ))}
                    </div>
                </TiltCard>

            </div>

            {/* Footer Inspiration */}
            <p className="text-center text-muted-foreground text-xs font-light mt-12 mb-8 lowercase tracking-[0.2em]">
                Pulse Architecture v2.0 &bull; Private Athlete Terminal
            </p>
        </div>
    );
}
