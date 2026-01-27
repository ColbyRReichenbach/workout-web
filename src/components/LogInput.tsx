"use client";

import { useState } from "react";
import { CheckCircle, Save, Plus, Timer, Activity } from "lucide-react";
import { WorkoutSegment } from "@/lib/types";

interface LogProps {
    segment: WorkoutSegment;
    idx: number;
    onLog: (segment: WorkoutSegment, idx: number, data: Record<string, unknown>) => void;
    calculatedWeight?: number;
}

import { useSettings } from "@/context/SettingsContext";
import { getUnitLabel, toDisplayWeight, toStorageWeight, toStorageDistance } from "@/lib/conversions";

export function LogStrengthSets({ segment, idx, onLog, calculatedWeight }: LogProps) {
    const { units } = useSettings();
    const defaultSets = segment.target?.sets || 3;

    // Use calculatedWeight if provided (from percent_1rm), otherwise fallback to weight_fixed
    const initialWeight = calculatedWeight ?? segment.target?.weight_fixed;
    const displayWeight = initialWeight ? toDisplayWeight(initialWeight, units) : "";

    const [sets, setSets] = useState(
        Array.from({ length: defaultSets }, () => ({
            weight: displayWeight || "",
            reps: segment.target?.reps || ""
        }))
    );
    const [notes, setNotes] = useState("");
    const [saved, setSaved] = useState(false);

    const updateSet = (setIdx: number, field: 'weight' | 'reps', value: number | string) => {
        const newSets = [...sets];
        newSets[setIdx] = { ...newSets[setIdx], [field]: value };
        setSets(newSets);
    };

    const handleSave = () => {
        // Convert display weights back to storage units (lbs)
        const setsToLog = sets.map(s => ({
            ...s,
            weight: toStorageWeight(s.weight, units)
        }));

        onLog(segment, idx, { sets: setsToLog, notes });
        setSaved(true);
    };

    if (saved) {
        return (
            <div className="flex items-center gap-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-6 py-4">
                <CheckCircle className="text-emerald-500" size={20} />
                <span className="text-emerald-600 font-bold text-xs uppercase tracking-widest">Protocol Synchronized</span>
            </div>
        );
    }

    const inputInner = "bg-card border border-border rounded-xl px-2 py-3 text-lg font-serif focus:bg-background focus:ring-4 focus:ring-primary/5 outline-none text-center text-foreground shadow-inner w-full placeholder:text-muted-foreground";

    return (
        <div className="space-y-4 w-full">
            <div className="grid grid-cols-[30px_1fr_1fr] gap-4 px-2">
                <div />
                <label className="text-[10px] text-muted-foreground uppercase font-bold text-center">Load ({getUnitLabel(units, 'weight')})</label>
                <label className="text-[10px] text-muted-foreground uppercase font-bold text-center">Reps</label>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {sets.map((set, sIdx) => (
                    <div key={sIdx} className="grid grid-cols-[30px_1fr_1fr] gap-4 items-center">
                        <span className="text-[10px] font-bold text-muted-foreground font-serif">S{sIdx + 1}</span>
                        <input
                            type="number"
                            placeholder="0"
                            value={set.weight}
                            onChange={(e) => updateSet(sIdx, 'weight', Number(e.target.value))}
                            className={inputInner}
                        />
                        <input
                            type="number"
                            placeholder="0"
                            value={set.reps}
                            onChange={(e) => updateSet(sIdx, 'reps', Number(e.target.value))}
                            className={inputInner}
                        />
                    </div>
                ))}
            </div>

            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Session notes (optional)..."
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm font-serif focus:bg-background focus:ring-4 focus:ring-primary/5 outline-none text-foreground shadow-inner resize-none h-20 placeholder:text-muted-foreground"
            />

            <div className="flex gap-3 pt-2 font-sans font-medium">
                <button
                    onClick={() => setSets([...sets, { weight: sets[sets.length - 1]?.weight || "", reps: "" }])}
                    className="flex-1 py-3 rounded-xl bg-muted text-muted-foreground hover:bg-muted/80 transition-colors duration-150 flex items-center justify-center gap-2 text-xs"
                >
                    <Plus size={14} /> Add Set
                </button>
                <button
                    onClick={handleSave}
                    className="flex-[2] py-3 rounded-xl bg-primary text-primary-foreground flex items-center justify-center transition-transform duration-150 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] gap-2 text-xs font-bold uppercase tracking-widest"
                >
                    <Save size={14} /> Index Performance
                </button>
            </div>
        </div>
    );
}

export function LogMetcon({ segment, idx, onLog }: LogProps) {
    const [rounds, setRounds] = useState("");
    const [reps, setReps] = useState("");
    const [time, setTime] = useState("");
    const [hr, setHr] = useState("");
    const [notes, setNotes] = useState("");
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        onLog(segment, idx, { rounds, reps, time_min: time, avg_hr: hr, notes });
        setSaved(true);
    };

    if (saved) {
        return (
            <div className="flex items-center gap-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-6 py-4">
                <CheckCircle className="text-emerald-500" size={20} />
                <span className="text-emerald-600 font-bold text-xs uppercase tracking-widest">Protocol Synchronized</span>
            </div>
        );
    }

    const inputInner = "bg-card border border-border rounded-xl px-2 py-3 text-lg font-serif focus:bg-background focus:ring-4 focus:ring-primary/5 outline-none text-center text-foreground shadow-inner w-full placeholder:text-muted-foreground";

    return (
        <div className="space-y-6 w-full">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold block text-center">Rounds</label>
                    <input
                        type="number"
                        placeholder="0"
                        value={rounds}
                        onChange={(e) => setRounds(e.target.value)}
                        className={inputInner}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold block text-center">Add. Reps</label>
                    <input
                        type="number"
                        placeholder="0"
                        value={reps}
                        onChange={(e) => setReps(e.target.value)}
                        className={inputInner}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold block text-center flex items-center justify-center gap-1">
                        <Timer size={10} /> Time (min)
                    </label>
                    <input
                        type="number"
                        placeholder="0"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className={inputInner}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold block text-center flex items-center justify-center gap-1">
                        <Activity size={10} /> Avg HR
                    </label>
                    <input
                        type="number"
                        placeholder="0"
                        value={hr}
                        onChange={(e) => setHr(e.target.value)}
                        className={inputInner}
                    />
                </div>
            </div>

            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Metcon notes..."
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm font-serif focus:bg-background focus:ring-4 focus:ring-primary/5 outline-none text-foreground shadow-inner resize-none h-20 placeholder:text-muted-foreground"
            />

            <button
                onClick={handleSave}
                className="w-full py-4 rounded-xl bg-primary text-primary-foreground flex items-center justify-center transition-transform duration-150 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] gap-2 text-xs font-bold uppercase tracking-widest"
            >
                <Save size={16} /> Log Metcon Results
            </button>
        </div>
    );
}

export function LogCardioBasic({ segment, idx, onLog }: LogProps) {
    const { units } = useSettings();
    const [distance, setDistance] = useState("");
    const [duration, setDuration] = useState(segment.target?.duration_min || "");
    const [hr, setHr] = useState("");
    const [notes, setNotes] = useState("");
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        onLog(segment, idx, {
            distance: toStorageDistance(distance, units),
            duration_min: duration,
            avg_hr: hr,
            notes
        });
        setSaved(true);
    };

    if (saved) {
        return (
            <div className="flex items-center gap-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-6 py-4">
                <CheckCircle className="text-emerald-500" size={20} />
                <span className="text-emerald-600 font-bold text-xs uppercase tracking-widest">Protocol Synchronized</span>
            </div>
        );
    }

    const inputInner = "bg-card border border-border rounded-xl px-2 py-3 text-lg font-serif focus:bg-background focus:ring-4 focus:ring-primary/5 outline-none text-center text-foreground shadow-inner w-full placeholder:text-muted-foreground";

    return (
        <div className="space-y-4 w-full md:min-w-[300px]">
            <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold block text-center">{getUnitLabel(units, 'distance').toUpperCase()}</label>
                    <input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        value={distance}
                        onChange={(e) => setDistance(e.target.value)}
                        className={inputInner}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold block text-center">Mins</label>
                    <input
                        type="number"
                        placeholder="0"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className={inputInner}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold block text-center">Avg HR</label>
                    <input
                        type="number"
                        placeholder="0"
                        value={hr}
                        onChange={(e) => setHr(e.target.value)}
                        className={inputInner}
                    />
                </div>
            </div>
            <button
                onClick={handleSave}
                className="w-full py-4 rounded-xl bg-primary text-primary-foreground flex items-center justify-center transition-transform duration-150 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] gap-2 text-xs font-bold uppercase tracking-widest"
            >
                <Save size={16} /> Sync Cardio Performance
            </button>
        </div>
    );
}

// Keeping compatibility for now
export const LogDetailed = LogStrengthSets;
export const LogInputOnly = LogCardioBasic;
