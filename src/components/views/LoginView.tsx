"use client";

import React, { useState } from 'react';
import { Mail, Lock, Heart, ArrowRight, ChevronLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { loginDemoUser, signInWithEmail, signUpWithEmail, resetPassword } from "@/app/actions/auth";
import { NanoParticles } from "@/components/NanoParticles";
import { motion, AnimatePresence } from 'framer-motion';

interface LoginViewProps {
    onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [view, setView] = useState<'initial' | 'login' | 'signup' | 'reset'>('initial');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'error' | 'success', message: string } | null>(null);

    const onEnter = () => setIsHovered(true);
    const onLeave = () => setIsHovered(false);

    const isInteractionActive = view !== 'initial' && (isFocused || email.length > 0 || password.length > 0);

    let intensity = 0;
    if (isInteractionActive) intensity = 2;
    else if (isHovered) intensity = 1;

    const heartDuration = intensity === 2 ? '0.7s' : intensity === 1 ? '1.8s' : '4s';

    const handleBack = () => {
        setView('initial');
        setIsFocused(false);
        setIsHovered(false);
        setStatus(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);

        // For demo/dev purposes, quickly bypass auth check if guest or special credentials
        // In production, await the actual result.
        // const result = await signInWithEmail(formData); 

        // Simulating success for the transition demo:
        setTimeout(() => {
            setLoading(false);
            onLoginSuccess();
        }, 800);
    };

    const handleGuestLogin = () => {
        loginDemoUser();
        // Trigger transition shortly after
        setTimeout(() => {
            onLoginSuccess();
        }, 500);
    }

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <style>{`
        @keyframes heartBeat {
          0% { transform: scale(1); }
          15% { transform: scale(1.1); }
          30% { transform: scale(1); }
          45% { transform: scale(1.15); }
          70% { transform: scale(1); }
        }
        .animate-heart-beat {
          animation-name: heartBeat;
          animation-duration: ${heartDuration};
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          transition: animation-duration 0.8s ease-in-out;
        }
      `}</style>

            <NanoParticles intensity={intensity} heartDuration={heartDuration} />

            {/* Heart Container - Shared Element */}
            <motion.div
                layoutId="heart-container"
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
            >
                <div className="relative">
                    <div className={`absolute inset-0 bg-[#ef4444]/10 blur-[100px] rounded-full animate-heart-beat transition-opacity duration-1000 ${intensity > 0 ? 'opacity-100' : 'opacity-20'}`} />
                    <motion.div layoutId="heart-icon">
                        <Heart
                            className="w-64 h-64 text-[#ef4444] fill-[#ef4444] animate-heart-beat relative z-20 drop-shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                        />
                    </motion.div>
                </div>
            </motion.div>

            <motion.div
                layoutId="card"
                className="relative z-20 w-full max-w-md px-6"
            >
                <div className="glass-card p-10 rounded-[2.5rem] space-y-8 min-h-[500px] flex flex-col justify-center transition-all duration-500 relative bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl">

                    {view !== 'initial' && (
                        <button
                            onClick={handleBack}
                            onMouseEnter={onEnter}
                            onMouseLeave={onLeave}
                            className="absolute top-7 left-8 p-2 text-zinc-400 hover:text-zinc-900 transition-colors z-30"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                    )}

                    {view === 'initial' && (
                        <div className="text-center space-y-3 pt-6 slide-in">
                            <h1 className="text-5xl font-serif text-zinc-900 tracking-tight leading-tight">
                                Welcome
                            </h1>
                            <p className="text-zinc-500 text-sm font-medium">
                                Continue your pulse
                            </p>
                        </div>
                    )}

                    <div className="flex-grow flex flex-col justify-center">
                        {status && (
                            <div className={`mb-6 p-4 rounded-2xl flex items-start gap-3 slide-in ${status.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                                {status.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                                <p className="text-xs font-bold leading-relaxed">{status.message}</p>
                            </div>
                        )}

                        {view === 'initial' ? (
                            <div className="space-y-4 slide-in">
                                <button
                                    onClick={() => setView('login')}
                                    onMouseEnter={onEnter}
                                    onMouseLeave={onLeave}
                                    className="w-full bg-zinc-900 text-white font-bold py-4 rounded-2xl hover:bg-zinc-800 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-zinc-900/10 grid grid-cols-[1fr_auto_1fr] items-center group"
                                >
                                    <div className="flex justify-start pl-6">
                                        <Mail className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                                    </div>
                                    <span className="whitespace-nowrap">Sign in with Email</span>
                                    <div className="flex justify-end pr-6">
                                        <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                    </div>
                                </button>

                                <div className="relative py-2">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-zinc-200/60"></div>
                                    </div>
                                    <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                                        <span className="bg-[#f5f2ed]/80 px-4 text-zinc-400 font-bold backdrop-blur-sm rounded-full">Or</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleGuestLogin}
                                    onMouseEnter={onEnter}
                                    onMouseLeave={onLeave}
                                    className="w-full bg-white/40 border border-zinc-200 text-zinc-900 py-4 rounded-2xl hover:bg-white/80 hover:scale-[1.02] active:scale-[0.98] transition-all grid grid-cols-[1fr_auto_1fr] items-center group shadow-sm"
                                >
                                    <div className="w-5 h-5 ml-6" />
                                    <div className="flex flex-col items-center">
                                        <span className="font-bold text-sm">Continue as guest</span>
                                        <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider group-hover:text-zinc-500 transition-colors">Mock data for full experience</span>
                                    </div>
                                    <div className="flex justify-end pr-6">
                                        <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                    </div>
                                </button>
                            </div>
                        ) : (
                            <form className="space-y-5 slide-in" onSubmit={handleSubmit}>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-[#ef4444] transition-colors" />
                                        <input
                                            type="email"
                                            value={email}
                                            required
                                            onMouseEnter={onEnter}
                                            onMouseLeave={onLeave}
                                            onFocus={() => { setIsFocused(true); setIsHovered(false); }}
                                            onBlur={() => setIsFocused(false)}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-white/60 border border-zinc-200 text-zinc-900 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:ring-4 focus:ring-[#ef4444]/5 focus:border-[#ef4444]/40 transition-all placeholder:text-zinc-300"
                                            placeholder="name@example.com"
                                        />
                                    </div>
                                </div>

                                {view !== 'reset' && (
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-[#ef4444] transition-colors" />
                                            <input
                                                type="password"
                                                value={password}
                                                required
                                                onMouseEnter={onEnter}
                                                onMouseLeave={onLeave}
                                                onFocus={() => { setIsFocused(true); setIsHovered(false); }}
                                                onBlur={() => setIsFocused(false)}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full bg-white/60 border border-zinc-200 text-zinc-900 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:ring-4 focus:ring-[#ef4444]/5 focus:border-[#ef4444]/40 transition-all placeholder:text-zinc-300"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    onMouseEnter={onEnter}
                                    onMouseLeave={onLeave}
                                    className="w-full bg-zinc-900 text-white font-bold py-4 rounded-2xl hover:bg-zinc-800 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-zinc-900/10 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? "Processing..." : view === 'reset' ? "Send Recovery Link" : "Continue"}
                                    {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
