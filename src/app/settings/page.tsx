"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Check, Bell, Moon, Globe, Bot, Shield, Sliders, ChevronRight, HeartPulse } from "lucide-react";
import { TiltCard } from "@/components/TiltCard";

export default function SettingsPage() {
    const [preferences, setPreferences] = useState({
        aiName: "ECHO-P1",
        aiPersonality: "Stoic",
        units: "Imperial (lb)",
        theme: "Pulse Light",
        notifications: true,
        dataPrivacy: "Private"
    });

    const categories = [
        { id: 'system', label: 'System Configuration', icon: Sliders },
        { id: 'intelligence', label: 'Pulse Intelligence', icon: Bot },
        { id: 'security', label: 'Data Lockdown', icon: Shield },
    ];

    const [activeCategory, setActiveCategory] = useState('system');

    const handleToggle = (key: keyof typeof preferences) => {
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="max-w-7xl mx-auto space-y-16">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                <div className="space-y-4">
                    <span className="text-primary font-bold tracking-[0.3em] text-[10px] uppercase block">Global Overrides</span>
                    <h1 className="font-serif text-6xl md:text-8xl text-stone-900 leading-[0.9]">Gear</h1>
                    <p className="text-stone-500 text-xl font-light italic max-w-xl">
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
                            className={`w-full flex items-center gap-4 px-8 py-6 rounded-[28px] transition-all border ${activeCategory === cat.id
                                    ? "bg-white border-black/5 text-stone-900 shadow-xl shadow-black/5"
                                    : "bg-transparent border-transparent text-stone-400 hover:text-stone-600 hover:bg-black/5"
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
                    <TiltCard className="rounded-[40px] p-12 min-h-[600px] group overflow-hidden" glowColor="shadow-primary/5">

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
                                    <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em] mb-4">Environment Options</h3>

                                    {[
                                        { label: "Visual Spectrum", val: preferences.theme, icon: Moon, color: "text-red-500", bg: "bg-red-500/5" },
                                        { label: "Measurement Rhythm", val: preferences.units, icon: Globe, color: "text-orange-500", bg: "bg-orange-500/5" }
                                    ].map((s) => (
                                        <div key={s.label} className="flex justify-between items-center group/item cursor-pointer p-6 -m-6 rounded-3xl transition-colors hover:bg-stone-50">
                                            <div className="flex items-center gap-6">
                                                <div className={`w-14 h-14 rounded-2xl ${s.bg} flex items-center justify-center ${s.color}`}><s.icon size={28} /></div>
                                                <div>
                                                    <h3 className="text-2xl font-serif text-stone-900">{s.label}</h3>
                                                    <p className="text-stone-400 text-sm font-light italic">Standard protocol defaults.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 text-stone-400">
                                                <span className="text-sm font-mono tracking-tight uppercase">{s.val}</span>
                                                <ChevronRight size={20} />
                                            </div>
                                        </div>
                                    ))}

                                    <div className="flex justify-between items-center p-6 -m-6 rounded-3xl transition-colors hover:bg-stone-50">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-2xl bg-amber-500/5 flex items-center justify-center text-amber-500"><Bell size={28} /></div>
                                            <div>
                                                <h3 className="text-2xl font-serif text-stone-900">Synchronized Alerts</h3>
                                                <p className="text-stone-400 text-sm font-light italic">Real-time pulse notifications.</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleToggle('notifications')}
                                            className={`w-16 h-9 rounded-full transition-all relative border border-black/5 ${preferences.notifications ? 'bg-primary' : 'bg-stone-200'}`}
                                        >
                                            <motion.div
                                                animate={{ x: preferences.notifications ? 30 : 4 }}
                                                className="w-7 h-7 rounded-full bg-white transition-all shadow-xl absolute top-0.5"
                                            />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {activeCategory === 'intelligence' && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-12"
                                >
                                    <div className="bg-stone-50 rounded-[32px] p-10 flex gap-10 items-center border border-black/[0.01]">
                                        <div className="w-24 h-24 rounded-3xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10 transition-transform hover:rotate-6">
                                            <HeartPulse size={48} />
                                        </div>
                                        <div>
                                            <h4 className="text-stone-900 font-serif text-4xl italic">Echo Core P.1</h4>
                                            <p className="text-stone-400 font-light mt-1 uppercase tracking-widest text-[10px]">Active Training Agent</p>
                                        </div>
                                    </div>

                                    <div className="space-y-10">
                                        <div className="relative group/field">
                                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest absolute -top-2 left-6 bg-white px-2 z-10 transition-colors group-hover:text-primary">Agent ID</label>
                                            <input
                                                type="text"
                                                value={preferences.aiName}
                                                onChange={(e) => setPreferences({ ...preferences, aiName: e.target.value })}
                                                className="w-full bg-stone-50 border border-black/[0.02] rounded-3xl px-6 py-5 text-2xl font-serif text-stone-900 focus:outline-none focus:ring-4 focus:ring-primary/5"
                                            />
                                        </div>

                                        <div className="space-y-6">
                                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-6">Cognitive Mode</label>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {['Motivational', 'Stoic', 'Clinical', 'Direct'].map(p => (
                                                    <button
                                                        key={p}
                                                        onClick={() => setPreferences({ ...preferences, aiPersonality: p })}
                                                        className={`py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all border ${preferences.aiPersonality === p
                                                                ? "bg-primary border-primary text-white shadow-2xl shadow-primary/30"
                                                                : "bg-white border-black/5 text-stone-400 hover:border-black/20"
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
                                        <div className="flex items-center gap-6 text-stone-900 mb-10">
                                            <Shield className="text-emerald-500" size={32} />
                                            <h3 className="text-4xl font-serif italic">Privacy Protocol</h3>
                                        </div>

                                        <div className="p-10 bg-emerald-500/5 rounded-[40px] border border-emerald-500/5">
                                            <p className="text-stone-500 text-lg font-light leading-relaxed italic">
                                                Your biometric spectrum is encrypted at rest. Data is strictly utilized for the Pulse training algorithm and is never broadcasted to external entities.
                                            </p>
                                        </div>

                                        <div className="space-y-4 pt-6">
                                            {['HealthKit Sync', 'Agent Data Review', 'Biometric Lock'].map(item => (
                                                <div key={item} className="flex justify-between items-center p-6 bg-stone-50/50 rounded-3xl hover:bg-stone-50 transition-all cursor-pointer group">
                                                    <span className="text-stone-700 font-serif text-xl">{item}</span>
                                                    <div className="w-12 h-7 bg-stone-200 rounded-full relative transition-colors group-hover:bg-stone-300">
                                                        <div className="w-5 h-5 bg-white rounded-full absolute top-1 left-1 shadow-sm" />
                                                    </div>
                                                </div>
                                            ))}
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
