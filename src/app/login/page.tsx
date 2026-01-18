"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Mail, Lock, Heart, ArrowRight, ChevronLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { loginDemoUser, loginWithOAuth, signInWithEmail, signUpWithEmail, resetPassword } from "@/app/actions/auth";

/**
 * NanoParticles Component - Heartbeat-Synced Burst Edition
 * Particles burst outward with each heartbeat, not continuously.
 */
interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    opacity: number;
    size: number;
    color: string;
}

const NanoParticles = ({ intensity: targetIntensity, heartDuration }: { intensity: number, heartDuration: string }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<Particle[]>([]);
    const requestRef = useRef<number>(0);
    const lastBeatTime = useRef<number>(0);
    const secondBeatFired = useRef<boolean>(false);
    const smoothIntensity = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const handleResize = () => {
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            ctx.scale(dpr, dpr);
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        // Parse heartbeat duration to get beat interval in ms
        const parseDuration = (dur: string) => {
            const val = parseFloat(dur);
            return val * 1000; // Convert seconds to ms
        };

        const createBurstParticles = (count: number, currentInt: number) => {
            const newParticles: Particle[] = [];
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 30 + Math.random() * 35;
                const minSpeed = 4.0;
                const maxSpeed = 12.0;
                const speed = minSpeed + (maxSpeed - minSpeed) * Math.min(currentInt / 2, 1);

                newParticles.push({
                    x: window.innerWidth / 2 + Math.cos(angle) * dist,
                    y: window.innerHeight / 2 + Math.sin(angle) * dist,
                    vx: Math.cos(angle) * speed * (0.7 + Math.random() * 0.6),
                    vy: Math.sin(angle) * speed * (0.7 + Math.random() * 0.6),
                    life: 1,
                    opacity: 0.7 + Math.random() * 0.3,
                    size: 2.0 + Math.random() * 3.0,
                    color: Math.random() > 0.4 ? '#ef4444' : '#f87171'
                });
            }
            return newParticles;
        };

        const animate = (time: number) => {
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

            smoothIntensity.current += (targetIntensity - smoothIntensity.current) * 0.08;
            const cur = smoothIntensity.current;

            // Get current beat interval based on heart duration
            const beatInterval = parseDuration(heartDuration);

            // Check if it's time for a beat burst
            // The heartbeat animation has 2 pulses per cycle (at 15% and 45%)
            const timeSinceLastBeat = time - lastBeatTime.current;

            // Trigger burst at first beat of cycle
            if (timeSinceLastBeat >= beatInterval) {
                lastBeatTime.current = time;
                secondBeatFired.current = false;
                // BIG burst on the beat
                const burstCount = Math.floor(25 + cur * 60); // 25-85 particles per burst
                particles.current.push(...createBurstParticles(burstCount, cur));
            }
            // Second pulse (at 30% of cycle)
            else if (!secondBeatFired.current && timeSinceLastBeat >= beatInterval * 0.30) {
                secondBeatFired.current = true;
                const burstCount = Math.floor(18 + cur * 45); // 18-63 particles
                particles.current.push(...createBurstParticles(burstCount, cur));
            }

            // Cap total particles
            const MAX_PARTICLES = 800;
            if (particles.current.length > MAX_PARTICLES) {
                particles.current = particles.current.slice(-MAX_PARTICLES);
            }

            // SLOW life decay = particles travel far
            const lifeDecay = 0.003 + (cur * 0.002);

            for (let i = particles.current.length - 1; i >= 0; i--) {
                const p = particles.current[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.995; // Less friction = travels further
                p.vy *= 0.995;
                p.life -= lifeDecay;

                if (p.life <= 0) {
                    particles.current.splice(i, 1);
                    continue;
                }

                // Draw particle - stays visible longer
                ctx.globalAlpha = p.life * p.opacity;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * (0.4 + p.life * 0.6), 0, Math.PI * 2);
                ctx.fill();
            }

            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(requestRef.current);
        };
    }, [targetIntensity, heartDuration]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none z-10 w-full h-full"
            style={{ opacity: 0.9 }}
        />
    );
};

export default function LoginPage() {
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

        let result;
        if (view === 'login') {
            result = await signInWithEmail(formData);
        } else if (view === 'signup') {
            result = await signUpWithEmail(formData);
        } else if (view === 'reset') {
            result = await resetPassword(email);
        }

        if (result?.error) {
            setStatus({ type: 'error', message: result.error });
        } else if (result?.success) {
            setStatus({ type: 'success', message: result.success });
        }
        setLoading(false);
    };

    return (
        <div className="relative min-h-screen w-full bg-[#f5f2ed] flex items-center justify-center overflow-hidden font-sans selection:bg-red-100">
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
        .glass {
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(0, 0, 0, 0.05);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.03);
        }
        .slide-in {
          animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

            {/* Background Glows */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute top-[-5%] left-[-5%] w-[50%] h-[50%] bg-red-100/30 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[50%] bg-[#ef4444]/5 blur-[120px] rounded-full" />
            </div>

            <NanoParticles intensity={intensity} heartDuration={heartDuration} />

            {/* Heart Container */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="relative">
                    <div className={`absolute inset-0 bg-[#ef4444]/10 blur-[100px] rounded-full animate-heart-beat transition-opacity duration-1000 ${intensity > 0 ? 'opacity-100' : 'opacity-20'}`} />
                    <Heart
                        className="w-64 h-64 text-[#ef4444] fill-[#ef4444] animate-heart-beat relative z-20 drop-shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                    />
                </div>
            </div>

            <div className="relative z-20 w-full max-w-md px-6">
                <div className="glass p-10 rounded-[2.5rem] space-y-8 min-h-[500px] flex flex-col justify-center transition-all duration-500 relative">

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

                                <button
                                    onClick={() => loginWithOAuth('google')}
                                    onMouseEnter={onEnter}
                                    onMouseLeave={onLeave}
                                    className="w-full bg-white border border-zinc-200 text-zinc-900 font-bold py-4 rounded-2xl hover:bg-zinc-50 hover:scale-[1.02] active:scale-[0.98] transition-all grid grid-cols-[1fr_auto_1fr] items-center group shadow-sm"
                                >
                                    <div className="flex justify-start pl-6">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
                                            <path d="M12 4.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                    </div>
                                    <span className="whitespace-nowrap">Sign in with Google</span>
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
                                    onClick={() => loginDemoUser()}
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

                    <div className="pt-6 space-y-4">
                        {view === 'login' && (
                            <div className="text-center slide-in">
                                <button
                                    onClick={() => { setView('reset'); setStatus(null); }}
                                    onMouseEnter={onEnter}
                                    onMouseLeave={onLeave}
                                    className="text-xs text-zinc-400 font-semibold hover:text-[#ef4444] transition-colors"
                                >
                                    Forgot your password?
                                </button>
                            </div>
                        )}

                        {view === 'initial' && (
                            <p className="text-center text-zinc-500 text-sm slide-in">
                                New here? {' '}
                                <button
                                    onClick={() => { setView('signup'); setStatus(null); }}
                                    onMouseEnter={onEnter}
                                    onMouseLeave={onLeave}
                                    className="text-zinc-900 hover:text-[#ef4444] transition-colors font-bold underline underline-offset-4 decoration-zinc-200"
                                >
                                    Create your pulse
                                </button>
                            </p>
                        )}

                        {(view === 'signup' || view === 'reset') && (
                            <div className="text-center slide-in">
                                <button
                                    onClick={() => { setView('login'); setStatus(null); }}
                                    onMouseEnter={onEnter}
                                    onMouseLeave={onLeave}
                                    className="text-zinc-900 hover:text-[#ef4444] transition-colors font-bold underline underline-offset-4 decoration-zinc-200 text-sm"
                                >
                                    Sign in instead
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
