"use client";

import { motion } from "framer-motion";
import { ArrowRight, Activity, Shield, Heart } from "lucide-react";
import { loginDemoUser, loginWithOAuth } from "@/app/actions/auth";

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-[#F5F5F4] flex flex-col items-center justify-center p-6 relative overflow-hidden">

            {/* --- SOPHISTICATED ATMOSPHERE --- */}

            {/* The Pulse Heart (Soft Central Aura) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.15, 1],
                        opacity: [0.03, 0.08, 0.03],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="w-[800px] h-[800px] bg-rose-500 rounded-full blur-[160px]"
                />
            </div>

            {/* Subtle Floating Red Data Points */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(12)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{
                            opacity: 0,
                            x: Math.random() * 100 + "%",
                            y: Math.random() * 100 + "%"
                        }}
                        animate={{
                            opacity: [0, 0.15, 0],
                            y: ["0%", "-10%"],
                        }}
                        transition={{
                            duration: 8 + Math.random() * 10,
                            repeat: Infinity,
                            delay: Math.random() * 5,
                            ease: "linear"
                        }}
                        className="absolute w-1.5 h-1.5 bg-rose-500/20 rounded-full"
                    />
                ))}
            </div>

            {/* --- THE TERMINAL --- */}

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-[440px] relative z-10"
            >
                <div className="bg-white rounded-[56px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.08)] border border-black/[0.02] p-2">
                    <div className="p-10 pb-8 space-y-12">

                        {/* Header Elevation */}
                        <div className="text-center space-y-6">
                            <motion.div
                                animate={{
                                    scale: [1, 1.05, 1],
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-24 h-24 bg-rose-600 text-white rounded-[32px] flex items-center justify-center mx-auto shadow-2xl shadow-rose-600/20 relative group"
                            >
                                <Heart size={44} fill="currentColor" strokeWidth={0} />
                                <motion.div
                                    animate={{ scale: [1, 1.6], opacity: [0.3, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute inset-0 border-2 border-rose-600 rounded-[32px]"
                                />
                            </motion.div>

                            <div className="space-y-2">
                                <h1 className="text-5xl font-serif text-stone-900 tracking-tight leading-none">Pulse</h1>
                                <p className="text-stone-400 font-bold tracking-[0.3em] text-[10px] uppercase">
                                    Adaptive Performance Intelligence
                                </p>
                            </div>
                        </div>

                        {/* Actions Matrix */}
                        <div className="space-y-4">
                            <button
                                onClick={() => loginWithOAuth('google')}
                                className="w-full h-20 bg-stone-900 text-white rounded-[28px] flex items-center justify-center gap-4 font-bold hover:bg-black transition-all active:scale-[0.98] shadow-xl shadow-stone-900/10"
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
                                    <path d="M12 4.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Continue with Google
                            </button>

                            <div className="relative py-4 flex items-center justify-center">
                                <span className="text-[10px] font-bold tracking-[0.4em] text-stone-300 uppercase">Synchronize Baseline</span>
                            </div>

                            <button
                                onClick={() => loginDemoUser()}
                                className="w-full h-auto py-6 bg-stone-50 border border-stone-200/50 rounded-[28px] flex items-center justify-between px-8 text-stone-600 hover:bg-white hover:border-rose-500/20 hover:text-stone-900 transition-all group"
                            >
                                <div className="text-left">
                                    <span className="font-serif italic block text-xl">Preview as Guest</span>
                                    <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold block mt-1 group-hover:text-rose-500 transition-colors">
                                        Includes Sample Dataset
                                    </span>
                                </div>
                                <ArrowRight size={22} className="text-stone-300 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
                            </button>
                        </div>
                    </div>

                    {/* Meta Footer */}
                    <div className="bg-stone-50/50 py-6 text-center border-t border-black/[0.02] rounded-b-[48px]">
                        <p className="text-[9px] text-stone-400 font-bold uppercase tracking-[0.4em] flex items-center justify-center gap-2">
                            <Shield size={10} className="text-rose-500/30" strokeWidth={3} />
                            Biometric Security Protocol v2.4
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Subtle Perspective Text */}
            <div className="fixed bottom-12 right-12 select-none pointer-events-none opacity-[0.03]">
                <p className="font-serif text-[12vw] text-stone-900 leading-none lowercase italic text-right">performance</p>
            </div>
        </div>
    );
}
