"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Moon, Globe, Bot, Shield, Sliders, HeartPulse, Download, Database } from "lucide-react";
import { TiltCard } from "@/components/TiltCard";
import { normalizeUnit } from "@/lib/conversions";
import { useSettings } from "@/context/SettingsContext";

import { exportUserData } from "@/app/actions/export";
import { DEMO_USER_ID } from "@/lib/userSettings";

interface PreferenceState {
    aiName: string;
    aiPersonality: string;
    notifications: boolean;
    dataPrivacy: string;
}

export default function SettingsPage() {
    const { units, theme, setUnits, setTheme } = useSettings();
    const [preferences, setPreferences] = useState<PreferenceState>({
        aiName: "ECHO-P1",
        aiPersonality: "Analytic",
        notifications: true,
        dataPrivacy: "Private"
    });

    const supabase = createClient();

    useEffect(() => {
        async function fetchSettings() {
            const { data: { user } } = await supabase.auth.getUser();

            let query = supabase.from('profiles').select('*');
            if (user) {
                query = query.eq('id', user.id);
            } else {
                query = query.eq('id', DEMO_USER_ID);
            }

            const { data } = await query.single();
            if (data) {
                setPreferences({
                    aiName: data.ai_name || "ECHO-P1",
                    aiPersonality: data.ai_personality || "Analytic",
                    notifications: data.notifications_enabled ?? true,
                    dataPrivacy: data.data_privacy || "Private"
                });
            }
        }
        fetchSettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const updateDB = async (newPrefs: PreferenceState) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const userId = user?.id || DEMO_USER_ID;

            const { error } = await supabase.from('profiles').update({
                ai_name: newPrefs.aiName,
                ai_personality: newPrefs.aiPersonality,
                notifications_enabled: newPrefs.notifications,
                data_privacy: newPrefs.dataPrivacy
            }).eq('id', userId);

            if (error) {
                console.error("Error updating preferences:", error);
            }
        } catch (err) {
            console.error("Unexpected update error:", err);
        }
    };

    // Direct DB update for units (same pattern that works for AI settings)
    const updateUnitsDB = async (newUnits: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const userId = user?.id || DEMO_USER_ID;

            console.log('[Settings] Updating units to:', newUnits, 'for user:', userId);

            const { error } = await supabase.from('profiles').update({
                units: newUnits
            }).eq('id', userId);

            if (error) {
                console.error("Error updating units:", error);
            } else {
                console.log('[Settings] Units saved successfully');
            }
        } catch (err) {
            console.error("Unexpected units update error:", err);
        }
    };

    // Direct DB update for theme (same pattern that works for AI settings)
    const updateThemeDB = async (newTheme: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const userId = user?.id || DEMO_USER_ID;

            console.log('[Settings] Updating theme to:', newTheme, 'for user:', userId);

            const { error } = await supabase.from('profiles').update({
                theme: newTheme
            }).eq('id', userId);

            if (error) {
                console.error("Error updating theme:", error);
            } else {
                console.log('[Settings] Theme saved successfully');
            }
        } catch (err) {
            console.error("Unexpected theme update error:", err);
        }
    };

    const handleSelect = async (key: keyof PreferenceState, value: string | boolean) => {
        const newPrefs = { ...preferences, [key]: value } as PreferenceState;
        setPreferences(newPrefs);
        await updateDB(newPrefs);
    };

    const handleExport = async () => {
        try {
            const data = await exportUserData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pulse_data_export_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Export failed:", error);
            alert("Export failed. Please try again.");
        }
    };

    const categories = [
        { id: 'system', label: 'System Configuration', icon: Sliders },
        { id: 'intelligence', label: 'Pulse Intelligence', icon: Bot },
        { id: 'security', label: 'Data Lockdown', icon: Shield },
    ];

    const [activeCategory, setActiveCategory] = useState('system');

    return (
        <div className="max-w-7xl mx-auto space-y-16">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                <div className="space-y-4">
                    <span className="text-primary font-bold tracking-[0.3em] text-[10px] uppercase block">Global Overrides</span>
                    <h1 className="font-serif text-6xl md:text-8xl text-foreground leading-[0.9]">Gear</h1>
                    <p className="text-muted-foreground text-xl font-light italic max-w-xl">
                        Optimize the interface and AI parameters to match your training environment.
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                {/* Navigation (Left) */}
                <div className="lg:col-span-3 space-y-3">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`w-full flex items-center gap-4 px-8 py-6 rounded-xl transition-all border ${activeCategory === cat.id
                                ? "bg-card border-border text-foreground shadow-xl shadow-black/5"
                                : "bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10"
                                }`}
                        >
                            <cat.icon size={22} className={activeCategory === cat.id ? "text-primary" : ""} />
                            <span className="font-serif text-xl">{cat.label}</span>
                            {activeCategory === cat.id && (
                                <motion.div layoutId="setting-active" className="ml-auto w-2 h-2 rounded-full bg-primary" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Settings Panel (Right) */}
                <div className="lg:col-span-9">
                    <TiltCard className="rounded-[48px] p-12 min-h-[600px] group overflow-hidden bg-card border-border" glowColor="shadow-primary/5">

                        <div className="absolute -right-20 -bottom-20 opacity-[0.02] group-hover:opacity-[0.04] transition-opacity pointer-events-none text-primary">
                            <Sliders size={400} strokeWidth={1} />
                        </div>

                        <div className="relative z-10 space-y-12">

                            {activeCategory === 'system' && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-10"
                                >
                                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mb-4">Environment Options</h3>

                                    {/* Visual Spectrum (Theme) */}
                                    <div className="flex justify-between items-center py-4 rounded-xl transition-colors hover:bg-muted/30 pr-4">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500"><Moon size={28} /></div>
                                            <div>
                                                <h3 className="text-2xl font-serif text-foreground">Visual Spectrum</h3>
                                                <p className="text-muted-foreground text-sm font-light italic">Standard protocol defaults.</p>
                                            </div>
                                        </div>
                                        <div className="flex bg-muted rounded-full p-1 border border-border">
                                            {['Light', 'Dark'].map((mode) => (
                                                <button
                                                    key={mode}
                                                    onClick={() => { setTheme(`Pulse ${mode}`); updateThemeDB(`Pulse ${mode}`); }}
                                                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${theme === `Pulse ${mode}`
                                                        ? "bg-background text-foreground shadow-sm"
                                                        : "text-muted-foreground hover:text-foreground"
                                                        }`}
                                                >
                                                    {mode}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Measurement Rhythm (Units) */}
                                    <div className="flex justify-between items-center py-4 rounded-xl transition-colors hover:bg-muted/30 pr-4">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500"><Globe size={28} /></div>
                                            <div>
                                                <h3 className="text-2xl font-serif text-foreground">Measurement Rhythm</h3>
                                                <p className="text-muted-foreground text-sm font-light italic">Currently using {units} baselines.</p>
                                            </div>
                                        </div>
                                        <div className="flex bg-muted rounded-full p-1 border border-border">
                                            {['Imperial', 'Metric'].map((unit) => (
                                                <button
                                                    key={unit}
                                                    onClick={() => { setUnits(normalizeUnit(unit)); updateUnitsDB(normalizeUnit(unit)); }}
                                                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${units === normalizeUnit(unit)
                                                        ? "bg-background text-foreground shadow-sm"
                                                        : "text-muted-foreground hover:text-foreground"
                                                        }`}
                                                >
                                                    {unit}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Synchronized Alerts (Locked) */}
                                    <div className="flex justify-between items-center py-4 rounded-xl transition-colors pr-4 opacity-60">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500"><Bell size={28} /></div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-2xl font-serif text-foreground">Synchronized Alerts</h3>
                                                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[8px] font-bold uppercase tracking-widest border border-primary/20">Coming Soon</span>
                                                </div>
                                                <p className="text-muted-foreground text-sm font-light italic">Real-time pulse notifications.</p>
                                            </div>
                                        </div>
                                        <div className="flex bg-muted rounded-full p-1 border border-border cursor-not-allowed">
                                            {['Off', 'On'].map((state) => (
                                                <button
                                                    key={state}
                                                    disabled
                                                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${state === 'Off'
                                                        ? "bg-background text-foreground shadow-sm" // Default to Off visually
                                                        : "text-muted-foreground"
                                                        }`}
                                                >
                                                    {state}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeCategory === 'intelligence' && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-12"
                                >
                                    <div className="bg-muted/30 rounded-xl p-10 flex gap-10 items-center border border-border">
                                        <div className="w-24 h-24 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 transition-transform hover:rotate-6">
                                            <HeartPulse size={48} />
                                        </div>
                                        <div>
                                            <h4 className="text-foreground font-serif text-4xl italic">Echo Core P.1</h4>
                                            <p className="text-muted-foreground font-light mt-1 uppercase tracking-widest text-[10px]">Active Training Agent</p>
                                        </div>
                                    </div>

                                    <div className="space-y-10">
                                        <div className="relative group/field">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest absolute -top-2 left-6 bg-card px-2 z-10 transition-colors group-hover:text-primary">Agent ID</label>
                                            <input
                                                type="text"
                                                value={preferences.aiName}
                                                onChange={(e) => setPreferences({ ...preferences, aiName: e.target.value })}
                                                onBlur={() => updateDB(preferences)}
                                                className="w-full bg-card border border-border rounded-xl px-6 py-5 text-2xl font-serif text-foreground focus:outline-none focus:ring-4 focus:ring-primary/5"
                                            />
                                        </div>

                                        <div className="space-y-6">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-6">Cognitive Mode</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                {['Analytic', 'Coach'].map(p => (
                                                    <button
                                                        key={p}
                                                        onClick={() => handleSelect('aiPersonality', p)}
                                                        className={`py-4 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all border ${preferences.aiPersonality === p
                                                            ? "bg-primary border-primary text-primary-foreground shadow-2xl shadow-primary/30"
                                                            : "bg-card border-border text-muted-foreground hover:border-foreground/20"
                                                            }`}
                                                    >
                                                        {p}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeCategory === 'security' && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-12"
                                >
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-6 text-foreground mb-10">
                                            <Shield className="text-emerald-500" size={32} />
                                            <h3 className="text-4xl font-serif italic">Privacy Protocol</h3>
                                        </div>

                                        <div className="p-10 bg-emerald-500/5 rounded-[48px] border border-emerald-500/10">
                                            <p className="text-muted-foreground text-lg font-light leading-relaxed italic">
                                                Your biometric spectrum is encrypted at rest. Data is strictly utilized for the Pulse training algorithm and is never broadcasted to external entities.
                                            </p>
                                        </div>

                                        <div className="space-y-4 pt-6">
                                            {[
                                                {
                                                    id: 'healthkit',
                                                    label: 'HealthKit Sync',
                                                    desc: 'Synchronize activity rings and heart rate data with Apple Health.',
                                                    locked: true
                                                },
                                                {
                                                    id: 'agent_review',
                                                    label: 'Agent Data Review',
                                                    desc: 'Allow Pulse AI to analyze your session logs to improve coaching algorithms.',
                                                    locked: false,
                                                    active: preferences.dataPrivacy === 'Analysis',
                                                    onToggle: () => handleSelect('dataPrivacy', preferences.dataPrivacy === 'Analysis' ? 'Private' : 'Analysis')
                                                }
                                            ].map(item => (
                                                <div
                                                    key={item.id}
                                                    onClick={() => !item.locked && item.onToggle && item.onToggle()}
                                                    className={`flex justify-between items-center p-6 ${item.locked ? "bg-muted/10 opacity-60 cursor-not-allowed" : "bg-muted/20 hover:bg-muted/40 cursor-pointer"} rounded-xl transition-all group`}
                                                >
                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-foreground font-serif text-xl">{item.label}</span>
                                                            {item.locked && (
                                                                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[8px] font-bold uppercase tracking-widest border border-primary/20">Coming Soon</span>
                                                            )}
                                                        </div>
                                                        <p className="text-muted-foreground text-xs mt-1 font-light leading-relaxed max-w-md">{item.desc}</p>
                                                    </div>

                                                    {item.locked ? (
                                                        <div className="w-12 h-7 bg-muted/50 rounded-full relative">
                                                            <div className="w-5 h-5 bg-muted-foreground/20 rounded-full absolute top-1 left-1" />
                                                        </div>
                                                    ) : (
                                                        <div className={`w-12 h-7 rounded-full relative transition-all duration-300 ${item.active ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-muted-foreground/20"}`}>
                                                            <motion.div
                                                                initial={false}
                                                                animate={{ x: item.active ? 20 : 0 }}
                                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                                className="w-5 h-5 bg-white rounded-full absolute top-1 left-1 shadow-sm"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="pt-12 border-t border-border mt-12">
                                            <div className="flex items-center gap-6 text-foreground mb-8">
                                                <Database className="text-primary" size={24} />
                                                <h3 className="text-2xl font-serif italic">Archive Protocols</h3>
                                            </div>
                                            <p className="text-muted-foreground text-sm font-light italic mb-8">
                                                Download your complete neural performance history as a standardized JSON archive for external analysis or portability.
                                            </p>
                                            <button
                                                onClick={handleExport}
                                                className="flex items-center gap-4 px-10 py-5 bg-background border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-sm group"
                                            >
                                                <Download size={16} className="group-hover:-translate-y-1 transition-transform" />
                                                Initiate Data Export
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                        </div>
                    </TiltCard>
                </div>

            </div>
        </div>
    );
}
