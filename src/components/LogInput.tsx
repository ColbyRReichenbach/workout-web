"use client";

import { useState } from "react";
import { CheckCircle, Save, Plus, Trash2, Timer, Zap, Activity } from "lucide-react";
import { WorkoutSegment } from "@/lib/types";

interface LogProps {
    segment: WorkoutSegment;
    idx: number;
    onLog: (segment: WorkoutSegment, idx: number, data: any) => void;
}

export function LogStrengthSets({ segment, idx, onLog }: LogProps) {
    const defaultSets = segment.target?.sets || 3;
    const [sets, setSets] = useState(
        Array.from({ length: defaultSets }, () => ({
            weight: segment.target?.weight_fixed || "",
            reps: segment.target?.reps || ""
        }))
    );
    const [saved, setSaved] = useState(false);

    const updateSet = (setIdx: number, field: string, value: any) => {
        const newSets = [...sets];
        (newSets[setIdx] as any)[field] = value;
        setSets(newSets);
    };

    const handleSave = () => {
        onLog(segment, idx, { sets });
        setSaved(true);
    };

    if (saved) {
        return (
            <div className="flex items-center gap-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl px-6 py-4">
                <CheckCircle className="text-emerald-500" size={20} />
                <span className="text-emerald-600 font-bold text-xs uppercase tracking-widest">Protocol Synchronized</span>
            </div>
        );
    }

    const inputInner = "bg-stone-50 border border-black/[0.03] rounded-xl px-2 py-3 text-lg font-serif focus:bg-white focus:ring-4 focus:ring-primary/5 outline-none text-center text-stone-900 shadow-inner w-full";

    return (
        <div className="space-y-4 w-full">
            <div className="grid grid-cols-[30px_1fr_1fr] gap-4 px-2">
                <div />
                <label className="text-[10px] text-stone-400 uppercase font-bold text-center">Load (lb)</label>
                <label className="text-[10px] text-stone-400 uppercase font-bold text-center">Reps</label>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {sets.map((set, sIdx) => (
                    <div key={sIdx} className="grid grid-cols-[30px_1fr_1fr] gap-4 items-center">
                        <span className="text-[10px] font-bold text-stone-300 font-mono">S{sIdx + 1}</span>
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

            <div className="flex gap-3 pt-2 font-sans font-medium">
                <button
                    onClick={() => setSets([...sets, { weight: sets[sets.length - 1]?.weight || "", reps: "" }])}
                    className="flex-1 py-3 rounded-2xl bg-stone-100 text-stone-500 hover:bg-stone-200 transition-all flex items-center justify-center gap-2 text-xs"
                >
                    <Plus size={14} /> Add Set
                </button>
                <button
                    onClick={handleSave}
                    className="flex-[2] py-3 rounded-2xl bg-primary text-white flex items-center justify-center transition-all shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] gap-2 text-xs font-bold uppercase tracking-widest"
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
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        onLog(segment, idx, { rounds, reps, time_min: time, avg_hr: hr });
        setSaved(true);
    };

    if (saved) {
        return (
            <div className="flex items-center gap-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl px-6 py-4">
                <CheckCircle className="text-emerald-500" size={20} />
                <span className="text-emerald-600 font-bold text-xs uppercase tracking-widest">Protocol Synchronized</span>
            </div>
        );
    }

    const inputInner = "bg-stone-50 border border-black/[0.03] rounded-xl px-2 py-3 text-lg font-serif focus:bg-white focus:ring-4 focus:ring-primary/5 outline-none text-center text-stone-900 shadow-inner w-full";

    return (
        <div className="space-y-6 w-full">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] text-stone-400 uppercase font-bold block text-center">Rounds</label>
                    <input
                        type="number"
                        placeholder="0"
                        value={rounds}
                        onChange={(e) => setRounds(e.target.value)}
                        className={inputInner}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] text-stone-400 uppercase font-bold block text-center">Add. Reps</label>
                    <input
                        type="number"
                        placeholder="0"
                        value={reps}
                        onChange={(e) => setReps(e.target.value)}
                        className={inputInner}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] text-stone-400 uppercase font-bold block text-center flex items-center justify-center gap-1">
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
                    <label className="text-[10px] text-stone-400 uppercase font-bold block text-center flex items-center justify-center gap-1">
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

            <button
                onClick={handleSave}
                className="w-full py-4 rounded-2xl bg-primary text-white flex items-center justify-center transition-all shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] gap-2 text-xs font-bold uppercase tracking-widest"
            >
                <Save size={16} /> Log Metcon Results
            </button>
        </div>
    );
}

export function LogCardioBasic({ segment, idx, onLog }: LogProps) {
    const [distance, setDistance] = useState("");
    const [duration, setDuration] = useState(segment.target?.duration_min || "");
    const [hr, setHr] = useState("");
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        onLog(segment, idx, { distance, duration_min: duration, avg_hr: hr });
        setSaved(true);
    };

    if (saved) {
        return (
            <div className="flex items-center gap-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl px-6 py-4">
                <CheckCircle className="text-emerald-500" size={20} />
                <span className="text-emerald-600 font-bold text-xs uppercase tracking-widest">Protocol Synchronized</span>
            </div>
        );
    }

    const inputInner = "bg-stone-50 border border-black/[0.03] rounded-xl px-2 py-3 text-lg font-serif focus:bg-white focus:ring-4 focus:ring-primary/5 outline-none text-center text-stone-900 shadow-inner w-full";

    return (
        <div className="space-y-4 w-full md:min-w-[300px]">
            <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                    <label className="text-[10px] text-stone-400 uppercase font-bold block text-center">Miles</label>
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
                    <label className="text-[10px] text-stone-400 uppercase font-bold block text-center">Mins</label>
                    <input
                        type="number"
                        placeholder="0"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className={inputInner}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] text-stone-400 uppercase font-bold block text-center">Avg HR</label>
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
                className="w-full py-4 rounded-2xl bg-primary text-white flex items-center justify-center transition-all shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] gap-2 text-xs font-bold uppercase tracking-widest"
            >
                <Save size={16} /> Sync Cardio Performance
            </button>
        </div>
    );
}

// Keeping compatibility for now
export const LogDetailed = LogStrengthSets;
export const LogInputOnly = LogCardioBasic;
