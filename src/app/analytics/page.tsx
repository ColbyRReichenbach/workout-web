"use client";

import { motion } from "framer-motion";
import { BarChart2, TrendingUp, Activity, PieChart, Info, HeartPulse } from "lucide-react";
import { TiltCard } from "@/components/TiltCard";

export default function AnalyticsPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-16">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                <div className="space-y-4">
                    <span className="text-primary font-bold tracking-[0.3em] text-[10px] uppercase block">Performance Intelligence</span>
                    <h1 className="font-serif text-6xl md:text-8xl text-stone-900 leading-[0.9]">Stats</h1>
                    <p className="text-stone-500 text-xl font-light italic max-w-xl">
                        A detailed spectrum of your training history and biometric evolution.
                    </p>
                </div>
            </header>

            {/* Premium Placeholder State */}
            <div className="grid grid-cols-1 gap-12">
                <TiltCard className="rounded-[48px] p-20 min-h-[600px] flex flex-col items-center justify-center text-center group overflow-hidden" glowColor="shadow-primary/5">

                    <div className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none flex items-center justify-center text-primary">
                        <BarChart2 size={600} strokeWidth={1} />
                    </div>

                    <div className="relative z-10 space-y-10 max-w-xl">
                        <div className="w-24 h-24 rounded-3xl bg-primary/5 flex items-center justify-center text-primary mx-auto mb-10 transition-transform group-hover:scale-110">
                            <TrendingUp size={48} />
                        </div>
                        <h2 className="text-5xl font-serif text-stone-900 leading-tight">Quantifying Your Rhythm</h2>
                        <p className="text-stone-400 text-xl leading-relaxed font-light italic">
                            The Echo Core is aggregating your session logs. Soon, you will be able to visualize your performance curve in real-time.
                        </p>

                        <div className="pt-10 flex flex-wrap justify-center gap-4">
                            {[
                                { icon: Activity, label: "Pulse Thresholds" },
                                { icon: PieChart, label: "Volume Spread" },
                                { icon: Info, label: "Fatigue Matrix" }
                            ].map((tag) => (
                                <div key={tag.label} className="flex items-center gap-3 px-6 py-3 bg-stone-50 border border-black/[0.03] rounded-2xl text-stone-500 text-[10px] font-bold uppercase tracking-widest">
                                    <tag.icon size={16} className="text-primary/50" /> {tag.label}
                                </div>
                            ))}
                        </div>
                    </div>
                </TiltCard>

                {/* Smaller Preview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <TiltCard className="rounded-[40px] p-10 h-80 overflow-hidden relative group" glowColor="shadow-primary/5">
                        <div className="flex justify-between items-start mb-10">
                            <h3 className="text-stone-900 font-serif text-2xl border-l-4 border-primary pl-6">Volume Cycle</h3>
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">+12% vs LY</span>
                        </div>
                        <div className="mt-8 h-32 flex items-end gap-3">
                            {[40, 70, 45, 90, 65, 80, 50, 60, 85].map((h, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    transition={{ delay: i * 0.05, duration: 1, ease: "easeOut" }}
                                    className="flex-1 bg-gradient-to-t from-primary/5 to-primary/20 rounded-t-xl group-hover:from-primary/10 group-hover:to-primary/40 transition-all"
                                />
                            ))}
                        </div>
                    </TiltCard>

                    <TiltCard className="rounded-[40px] p-10 h-80 overflow-hidden relative group" glowColor="shadow-primary/5">
                        <div className="flex justify-between items-start mb-10">
                            <h3 className="text-stone-900 font-serif text-2xl border-l-4 border-stone-200 pl-6">Biometric Sinus</h3>
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Live</span>
                        </div>
                        <div className="mt-8 flex items-center justify-center">
                            <motion.div
                                animate={{
                                    scale: [1, 1.05, 1],
                                    opacity: [0.2, 0.4, 0.2]
                                }}
                                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                className="text-primary"
                            >
                                <HeartPulse size={120} strokeWidth={1} />
                            </motion.div>
                        </div>
                    </TiltCard>
                </div>
            </div>
        </div>
    );
}
