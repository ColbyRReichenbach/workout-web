/**
 * BiometricsModal Component
 * 
 * Allows users to log their daily vitals (weight, HRV, resting HR, sleep).
 * Persists data to the 'biometrics' table for historical tracking.
 */

"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { X, Scale, Activity, Heart, Moon, Save } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useSettings } from "@/context/SettingsContext";
import { toStorageWeight } from "@/lib/conversions";
import { DEMO_USER_ID } from "@/lib/userSettings";

interface BiometricsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function BiometricsModal({ isOpen, onClose, onSuccess }: BiometricsModalProps) {
    const { units } = useSettings();
    const [weight, setWeight] = useState("");
    const [hrv, setHrv] = useState("");
    const [restingHr, setRestingHr] = useState("");
    const [sleep, setSleep] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || DEMO_USER_ID;

        // Convert weight to LBS for DB storage if in metric
        const weightLbs = toStorageWeight(weight, units);

        const { error } = await supabase.from('biometrics').insert({
            user_id: userId,
            date: new Date().toISOString().split('T')[0],
            weight_lbs: weightLbs || null,
            hrv: parseInt(hrv) || null,
            resting_hr: parseInt(restingHr) || null,
            sleep_hours: parseFloat(sleep) || null,
        });

        if (error) {
            console.error("Failed to save biometrics:", error);
        } else {
            if (onSuccess) onSuccess();
            onClose();
        }
        setLoading(false);
    };

    const inputClasses = "w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-xl font-serif focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all text-foreground placeholder:text-muted-foreground/30";
    const labelClasses = "text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-2";

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
                        className="fixed left-[50%] top-[50%] z-[210] w-[95vw] max-w-[480px] translate-x-[-50%] translate-y-[-50%] rounded-[48px] bg-card border border-border p-10 shadow-2xl focus:outline-none overflow-auto"
                    >
                        <div className="flex justify-between items-start mb-10 relative z-10">
                            <div>
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.3em] mb-2 block">Vitals Capture</span>
                                <Dialog.Title className="text-4xl font-serif text-foreground italic">Biometrics</Dialog.Title>
                            </div>
                            <button
                                onClick={onClose}
                                className="h-12 w-12 flex items-center justify-center rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground transition-colors border border-border"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClasses}>
                                        <Scale size={14} className="text-primary/40" /> Weight ({units === 'metric' ? 'kg' : 'lb'})
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="0.0"
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                        className={inputClasses}
                                    />
                                </div>
                                <div>
                                    <label className={labelClasses}>
                                        <Activity size={14} className="text-primary/40" /> HRV (ms)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={hrv}
                                        onChange={(e) => setHrv(e.target.value)}
                                        className={inputClasses}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClasses}>
                                        <Heart size={14} className="text-primary/40" /> Resting HR
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={restingHr}
                                        onChange={(e) => setRestingHr(e.target.value)}
                                        className={inputClasses}
                                    />
                                </div>
                                <div>
                                    <label className={labelClasses}>
                                        <Moon size={14} className="text-primary/40" /> Sleep (h)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="0.0"
                                        step="0.1"
                                        value={sleep}
                                        onChange={(e) => setSleep(e.target.value)}
                                        className={inputClasses}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="w-full py-6 mt-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {loading ? "Synchronizing..." : <><Save size={20} /> Synchronize Vitals</>}
                            </button>
                        </div>

                    </motion.div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
