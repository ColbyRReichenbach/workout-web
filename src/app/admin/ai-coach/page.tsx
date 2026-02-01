"use client";

import { useState, useEffect } from 'react';
import {
    Activity, ThumbsUp, ThumbsDown, Clock, TrendingUp, AlertCircle,
    RefreshCw, ArrowLeft, ShieldAlert, Target, Terminal, Search,
    Cpu, Database, Microscope, Zap, LayoutDashboard, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import { TiltCard } from '@/components/TiltCard';
import { cn } from '@/lib/utils';

interface AnalyticsData {
    period: {
        days: number;
        start: string;
        end: string;
    };
    feedback: {
        total: number;
        positive: number;
        negative: number;
        satisfactionRate: number | null;
        recentNegative: Array<{
            intent: string;
            tools: string[];
            latency: number;
            date: string;
            user_message?: string;
            ai_response?: string;
        }>;
    };
    engineering: {
        totalLogs: number;
        totalTokens: number;
        totalCostUsd: number;
        avgLatencyMs: number | null;
        modelDistribution: Record<string, number>;
    };
    intents: Array<{
        intent: string;
        positive: number;
        negative: number;
        total: number;
        successRate: number;
    }>;
    tools: Array<{
        tool: string;
        count: number;
    }>;
    queryAnalytics: {
        totalQueries: number;
        topExercises: Array<{ name: string; count: number }>;
        correctionRate: number;
        typoPatterns: Array<{ typo: string; corrected: string; frequency: number }>;
    };
}

export default function AdminAnalyticsPage() {
    const { isAdmin, isLoading: settingsLoading } = useSettings();
    const router = useRouter();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [days, setDays] = useState(7);
    const [activeFailure, setActiveFailure] = useState<number | null>(null);

    const fetchAnalytics = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/ai/analytics?days=${days}`);
            if (!res.ok) throw new Error('System Access Denied. Elevated privileges required.');
            const json = await res.json();
            setData(json);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown link failure');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!settingsLoading && !isAdmin) {
            router.push('/');
        }
    }, [isAdmin, settingsLoading, router]);

    useEffect(() => {
        if (isAdmin) fetchAnalytics();
    }, [days, isAdmin]);

    if (settingsLoading || (!isAdmin && !error)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-t-2 border-primary animate-spin" />
                    <Activity size={24} className="absolute inset-0 m-auto text-primary animate-pulse" />
                </div>
                <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Authenticating Pulse Link...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
                <div className="w-20 h-20 rounded-[32px] bg-primary/10 border border-primary/20 flex items-center justify-center mb-8 relative group overflow-hidden">
                    <div className="absolute inset-0 bg-primary/20 animate-pulse" />
                    <ShieldAlert size={40} className="relative text-primary" />
                </div>
                <h1 className="text-4xl font-serif font-bold text-foreground mb-4 tracking-tighter">Access Denied</h1>
                <p className="text-muted-foreground mb-10 max-w-sm italic font-light">Your biometric profile does not match the required clearance level for internal analytics.</p>
                <Link href="/" className="px-8 py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                    Return to Safe Zone
                </Link>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 relative overflow-hidden font-sans">
            {/* Scanline Diagnostic Overlay */}
            <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden opacity-20">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-primary shadow-[0_0_15px_rgba(239,68,68,0.5)] scan-line-admin" />
            </div>

            {/* Header Area - Sticky under main navbar */}
            <header className="sticky top-[96px] z-40 bg-background/60 backdrop-blur-3xl border-b border-border shadow-sm">
                <div className="max-w-[1600px] mx-auto px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                <LayoutDashboard size={20} className="text-primary-foreground" />
                            </div>
                            <div>
                                <h1 className="text-xl font-serif font-bold text-foreground tracking-tight leading-none">Diagnostic Terminal</h1>
                                <p className="text-[10px] text-primary font-bold uppercase tracking-[0.2em] mt-1 opacity-60">System Version 2.1.0-ENG</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center bg-muted border border-border rounded-2xl px-2 py-1">
                            {[
                                { label: '24H', value: 1 },
                                { label: '7D', value: 7 },
                                { label: '30D', value: 30 },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setDays(opt.value)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-xl text-[10px] font-bold transition-all",
                                        days === opt.value
                                            ? "bg-background text-primary shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={fetchAnalytics}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-2xl transition-all disabled:opacity-50 group"
                        >
                            <RefreshCw size={14} className={cn(loading && "animate-spin")} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Refresh Telemetry</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto px-8 pt-32 pb-20 relative z-10">
                {/* Status HUD (Top Cards) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <AuditCard
                        icon={<ThumbsUp size={24} />}
                        label="User Sentiment"
                        value={data.feedback.satisfactionRate ? `${data.feedback.satisfactionRate}%` : "0%"}
                        subtext={`${data.feedback.total} Active Signals`}
                        color="emerald"
                    />
                    <AuditCard
                        icon={<Zap size={24} />}
                        label="Operational Cost"
                        value={`$${data.engineering.totalCostUsd}`}
                        subtext={`${data.engineering.totalTokens.toLocaleString()} Total Tokens`}
                        color="amber"
                    />
                    <AuditCard
                        icon={<Clock size={24} />}
                        label="System Latency"
                        value={data.engineering.avgLatencyMs ? `${data.engineering.avgLatencyMs}ms` : "0ms"}
                        subtext="Mean Response Velocity"
                        color="indigo"
                    />
                    <AuditCard
                        icon={<AlertCircle size={24} />}
                        label="Critical Faults"
                        value={data.feedback.negative.toString()}
                        subtext="Negative Feedback Loops"
                        color="rose"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Primary Audit Pane */}
                    <div className="lg:col-span-8 space-y-10">

                        {/* Intent Success Matrix */}
                        <section className="bg-card border border-border rounded-[40px] p-8 relative overflow-hidden">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-2xl font-serif font-bold text-foreground flex items-center gap-3">
                                        <Microscope size={24} className="text-primary" />
                                        Cognitive Integrity
                                    </h3>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold mt-1">Intent Recognition Precision Heatmap</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {data.intents.map((intent) => (
                                    <div key={intent.intent} className="p-5 rounded-3xl bg-muted/30 border border-border hover:bg-muted/50 transition-all group">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    intent.successRate > 80 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                                                )} />
                                                <span className="text-xs font-bold uppercase tracking-tight text-foreground group-hover:text-primary transition-colors">{intent.intent === 'UNKNOWN' ? 'UNCLASSIFIED' : intent.intent}</span>
                                            </div>
                                            <span className="text-[10px] font-mono text-muted-foreground">{intent.total} hits</span>
                                        </div>
                                        <div className="relative h-2 bg-muted rounded-full overflow-hidden border border-border">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${intent.successRate}%` }}
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-1000",
                                                    intent.successRate > 80 ? "bg-emerald-500" : "bg-rose-500"
                                                )}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-2">
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{intent.successRate}% Accuracy</span>
                                            <span className="text-[9px] font-mono text-muted-foreground">FLAWLESS {intent.positive} / {intent.total}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Audit Terminal (Recent Failures) */}
                        <section className="bg-card border border-border rounded-[40px] p-0 overflow-hidden">
                            <div className="p-8 border-b border-border flex items-center justify-between bg-muted/10">
                                <div>
                                    <h3 className="text-2xl font-serif font-bold text-foreground flex items-center gap-3">
                                        <Terminal size={24} className="text-primary" />
                                        Failure Audit Console
                                    </h3>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold mt-1">Raw Stream: Recent Negative Signal Decryption</p>
                                </div>
                                <div className="px-4 py-1.5 rounded-full border border-rose-500/20 bg-rose-500/5 text-rose-500 text-[10px] font-bold uppercase tracking-widest animate-pulse">
                                    LIVE MONITORING
                                </div>
                            </div>

                            <div className="divide-y divide-border">
                                {data.feedback.recentNegative.length === 0 ? (
                                    <div className="p-20 text-center">
                                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                                            <ThumbsUp size={24} className="text-emerald-500" />
                                        </div>
                                        <h4 className="text-foreground font-serif text-xl mb-2">Zero Critical Deviations</h4>
                                        <p className="text-muted-foreground text-xs font-light italic">Model response integrity is operating at 100% within the current bio-window.</p>
                                    </div>
                                ) : (
                                    data.feedback.recentNegative.map((item, i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                "p-6 transition-all cursor-pointer group hover:bg-muted/20",
                                                activeFailure === i ? "bg-muted/30" : ""
                                            )}
                                            onClick={() => setActiveFailure(activeFailure === i ? null : i)}
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                                                        <ThumbsDown size={14} className="text-rose-500" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-foreground uppercase tracking-tighter">{item.intent}</span>
                                                            <span className="text-[10px] text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded uppercase tracking-widest">{item.latency}MS</span>
                                                        </div>
                                                        <p className="text-[9px] text-muted-foreground font-mono mt-0.5 uppercase opacity-40">{new Date(item.date).toLocaleString()} • ID: AUDIT-{i + 1000}</p>
                                                    </div>
                                                </div>
                                                <ChevronRight size={16} className={cn("text-muted-foreground transition-transform duration-300", activeFailure === i ? "rotate-90 text-primary" : "")} />
                                            </div>

                                            <AnimatePresence>
                                                {activeFailure === i && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
                                                            <div className="space-y-4">
                                                                <div className="space-y-2">
                                                                    <p className="text-[9px] uppercase font-bold text-primary tracking-widest flex items-center gap-2">
                                                                        <Search size={10} /> User Payload
                                                                    </p>
                                                                    <div className="p-4 rounded-2xl bg-muted border border-border font-mono text-[11px] text-muted-foreground italic">
                                                                        "{item.user_message}"
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <p className="text-[9px] uppercase font-bold text-primary tracking-widest flex items-center gap-2">
                                                                        <Cpu size={10} /> Active Tools
                                                                    </p>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {item.tools && item.tools.length > 0 ? item.tools.map(t => (
                                                                            <span key={t} className="px-2 py-1 rounded bg-muted border border-border text-[10px] font-mono text-primary/80">{t}()</span>
                                                                        )) : <span className="text-[10px] text-muted-foreground font-mono italic">No tactical logic deployed</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <p className="text-[9px] uppercase font-bold text-primary tracking-widest flex items-center gap-2">
                                                                    <Activity size={10} /> Neural Response Output
                                                                </p>
                                                                <div className="p-4 rounded-2xl bg-muted border border-border font-mono text-[11px] text-muted-foreground leading-relaxed overflow-y-auto max-h-40">
                                                                    {item.ai_response}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Secondary Intelligence Column */}
                    <div className="lg:col-span-4 space-y-10">

                        {/* Model Distribution */}
                        <section className="bg-card border border-border rounded-[40px] p-8">
                            <h3 className="text-lg font-serif font-bold text-foreground mb-8 border-b border-border pb-4 flex items-center gap-2">
                                <Cpu size={18} className="text-primary" />
                                Model Fleet Status
                            </h3>
                            <div className="space-y-4">
                                {Object.keys(data.engineering.modelDistribution).length === 0 ? (
                                    <div className="py-8 text-center border border-dashed border-border rounded-3xl">
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">No Telemetry Data</p>
                                    </div>
                                ) : (
                                    Object.entries(data.engineering.modelDistribution).map(([model, count]) => (
                                        <div key={model} className="flex items-center justify-between group">
                                            <span className="text-[11px] font-mono text-muted-foreground group-hover:text-foreground transition-colors">{model}</span>
                                            <div className="flex items-center gap-4">
                                                <div className="w-32 h-1 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary"
                                                        style={{ width: `${(count / data.engineering.totalLogs) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-mono font-bold text-primary">{Math.round((count / data.engineering.totalLogs) * 100)}%</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        {/* Tool Usage Stack */}
                        <section className="bg-card border border-border rounded-[40px] p-8">
                            <h3 className="text-lg font-serif font-bold text-foreground mb-8 border-b border-border pb-4">Tactical Tool Load</h3>
                            <div className="space-y-4 font-mono">
                                {data.tools.length === 0 ? (
                                    <div className="py-8 text-center border border-dashed border-border rounded-3xl">
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">No Tools Deployed</p>
                                    </div>
                                ) : (
                                    data.tools.map((tool) => (
                                        <div key={tool.tool} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10">
                                                    <Target size={14} className="text-primary" />
                                                </div>
                                                <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">{tool.tool}</span>
                                            </div>
                                            <span className="text-xs font-bold text-primary">{tool.count}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        {/* Typo Recovery Matrix */}
                        <section className="bg-card border border-border rounded-[40px] p-8 relative overflow-hidden">
                            <h3 className="text-lg font-serif font-bold text-foreground mb-8 border-b border-border pb-4">Normalization Engine</h3>
                            <div className="space-y-4 relative z-10">
                                {data.queryAnalytics.typoPatterns.length === 0 ? (
                                    <div className="py-8 text-center border border-dashed border-border rounded-3xl">
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Stream Idle</p>
                                    </div>
                                ) : (
                                    data.queryAnalytics.typoPatterns.map((pattern, i) => (
                                        <div key={i} className="flex items-center justify-between text-[11px] group">
                                            <div className="flex items-center gap-3">
                                                <span className="text-muted-foreground font-mono italic opacity-60">"{pattern.typo}"</span>
                                                <ChevronRight size={10} className="text-primary/40" />
                                                <span className="text-primary font-bold uppercase tracking-widest">{pattern.corrected}</span>
                                            </div>
                                            <span className="text-[9px] font-mono text-muted-foreground">{pattern.frequency}x</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        {/* Database Health Card */}
                        <section className="p-8 rounded-[40px] bg-primary/5 border border-primary/20">
                            <div className="flex items-center gap-4 mb-4">
                                <Database size={24} className="text-primary" />
                                <div>
                                    <h4 className="text-sm font-serif font-bold text-foreground">Audit Synchronization</h4>
                                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-[0.2em]">Last Linked: {new Date().toLocaleTimeString()}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-card p-3 rounded-2xl border border-border">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Telemetry</p>
                                    <p className="text-xl font-mono text-foreground">{data.engineering.totalLogs}</p>
                                </div>
                                <div className="bg-card p-3 rounded-2xl border border-border">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Status</p>
                                    <p className="text-xl font-mono text-primary">NOMINAL</p>
                                </div>
                            </div>
                        </section>

                    </div>
                </div>
            </main>

            <style jsx global>{`
                @keyframes scan-line-anim {
                    0% { transform: translateY(-100vh); }
                    100% { transform: translateY(100vh); }
                }
                .scan-line-admin {
                    animation: scan-line-anim 8s linear infinite;
                }
            `}</style>
        </div>
    );
}

function AuditCard({ icon, label, value, subtext, color }: {
    icon: React.ReactNode,
    label: string,
    value: string,
    subtext: string,
    color: 'emerald' | 'indigo' | 'rose' | 'amber'
}) {
    const colors = {
        emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/10' },
        indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', glow: 'shadow-indigo-500/10' },
        rose: { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/20', glow: 'shadow-rose-500/10' },
        amber: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20', glow: 'shadow-amber-500/10' }
    };

    const c = colors[color];

    return (
        <TiltCard
            glowColor={c.glow}
            className="group rounded-[40px] p-8 border border-border overflow-hidden bg-card"
        >
            <div className={`absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-300 pointer-events-none ${c.text}`}>
                <div className="scale-[4]">
                    {icon}
                </div>
            </div>

            <div className="flex justify-between items-start mb-10 relative z-10">
                <div className={cn("w-14 h-14 rounded-[22px] flex items-center justify-center border transition-all duration-300 group-hover:scale-110", c.bg, c.border, c.text)}>
                    {icon}
                </div>
                <div className="text-right">
                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-[0.3em] opacity-40">{label}</p>
                    <div className="w-6 h-[1px] bg-border ml-auto mt-2" />
                </div>
            </div>

            <div className="relative z-10">
                <h3 className="text-5xl font-serif text-foreground tracking-tighter mb-1">
                    {value}
                </h3>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">{subtext}</p>
            </div>

            <div className="mt-8 h-[2px] w-8 bg-muted group-hover:w-16 group-hover:bg-primary transition-all duration-500" />
        </TiltCard>
    );
}
