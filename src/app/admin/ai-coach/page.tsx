"use client";

import { useState, useEffect } from 'react';
import { BarChart3, ThumbsUp, ThumbsDown, Clock, TrendingUp, AlertCircle, RefreshCw, ArrowLeft, ExternalLink, ShieldAlert, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

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
    performance: {
        avgLatencyMs: number | null;
        latencyCount: number;
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

/**
 * STANDALONE ADMIN DASHBOARD
 * For internal model improvement only.
 */
export default function AdminAnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [days, setDays] = useState(7);
    const [activeTab, setActiveTab] = useState<'overview' | 'quality' | 'performance'>('overview');

    const fetchAnalytics = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/ai/analytics?days=${days}`);
            if (!res.ok) throw new Error('Failed to fetch analytics. Are you logged in?');
            const json = await res.json();
            setData(json);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [days]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0b] text-white">
                <RefreshCw size={32} className="text-primary animate-spin mb-4" />
                <p className="text-muted-foreground font-mono uppercase tracking-widest text-xs">Initializing Admin Link...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0b] p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
                    <ShieldAlert size={32} className="text-destructive" />
                </div>
                <h1 className="text-xl font-bold text-white mb-2">Access Control Error</h1>
                <p className="text-muted-foreground mb-8 max-w-sm">{error}</p>
                <div className="flex gap-4">
                    <button onClick={fetchAnalytics} className="px-6 py-2 bg-muted rounded-xl text-sm font-medium hover:bg-muted/80 transition-all">
                        Try Again
                    </button>
                    <Link href="/" className="px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-all">
                        Return to App
                    </Link>
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="min-h-screen bg-[#0a0a0b] text-slate-200 selection:bg-primary/30">
            {/* Top Bar */}
            <header className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                <TrendingUp size={20} className="text-primary-foreground" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-white tracking-tight">AI Internal Dashboard</h1>
                                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest leading-none mt-1">Model Precision Layer</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <select
                            value={days}
                            onChange={(e) => setDays(Number(e.target.value))}
                            className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                        >
                            <option value={1}>Last 24h</option>
                            <option value={7}>Last 7 Days</option>
                            <option value={30}>Last 30 Days</option>
                        </select>
                        <button
                            onClick={fetchAnalytics}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                            title="Refresh Data"
                        >
                            <RefreshCw size={14} />
                        </button>
                        <div className="h-8 w-px bg-white/10 mx-2" />
                        <Link
                            href="/"
                            className="text-xs font-semibold text-muted-foreground hover:text-white transition-colors flex items-center gap-1.5"
                        >
                            <ArrowLeft size={14} /> Back to Live
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10">
                {/* Core Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
                    <StatBox
                        icon={<ThumbsUp size={18} />}
                        label="User Satisfaction"
                        value={data.feedback.satisfactionRate ? `${data.feedback.satisfactionRate}%` : "—"}
                        trend={`${data.feedback.total} samples`}
                        color="emerald"
                    />
                    <StatBox
                        icon={<Clock size={18} />}
                        label="Average Latency"
                        value={data.performance.avgLatencyMs ? `${data.performance.avgLatencyMs}ms` : "—"}
                        trend="Processing Speed"
                        color="indigo"
                    />
                    <StatBox
                        icon={<AlertCircle size={18} />}
                        label="Negative Signals"
                        value={data.feedback.negative.toString()}
                        trend="Critical Feedback"
                        color="rose"
                    />
                    <StatBox
                        icon={<RefreshCw size={18} />}
                        label="Correction Accuracy"
                        value={`${Math.round(data.queryAnalytics.correctionRate * 100)}%`}
                        trend="Typo Recovery"
                        color="amber"
                    />
                </div>

                {/* Main Content Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left: Quality Analysis */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Intent Accuracy Table */}
                        <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-8">
                            <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                                <Target size={18} className="text-primary" />
                                Intent Precision Analytics
                            </h3>

                            <div className="space-y-4">
                                {data.intents.map((intent) => (
                                    <div key={intent.intent} className="bg-black/20 rounded-2xl p-4 border border-white/[0.02]">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-1.5 rounded-lg ${intent.successRate > 80 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                                    <ShieldAlert size={14} />
                                                </div>
                                                <span className="text-sm font-bold text-zinc-100 uppercase tracking-tighter">{intent.intent}</span>
                                            </div>
                                            <span className="text-xs font-mono text-zinc-500">
                                                {intent.total} interactions
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${intent.successRate}%` }}
                                                    className={`h-full rounded-full ${intent.successRate > 80 ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]' : 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)]'}`}
                                                />
                                            </div>
                                            <span className={`text-sm font-bold font-mono w-10 text-right ${intent.successRate > 80 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {intent.successRate}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Failure Logs */}
                        <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-8">
                            <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                                <ShieldAlert size={18} className="text-rose-500" />
                                Model Failure Patterns (Recent Negative Feedback)
                            </h3>

                            {data.feedback.recentNegative.length === 0 ? (
                                <div className="py-12 text-center bg-black/20 rounded-2xl border border-dashed border-white/10">
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest">No negative signals recorded</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {data.feedback.recentNegative.map((item, i) => (
                                        <div key={i} className="p-5 rounded-2xl bg-black/30 border border-white/5 transition-all hover:bg-black/40">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded-md text-[10px] font-bold uppercase tracking-tight border border-rose-500/20">
                                                        Negative
                                                    </span>
                                                    <span className="text-xs font-mono font-bold text-zinc-300">
                                                        {item.intent}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-zinc-600 font-mono">
                                                    {new Date(item.date).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] uppercase text-zinc-600 font-bold tracking-widest">User Query</p>
                                                    <p className="text-xs text-zinc-400 italic">"{item.user_message || "N/A"}"</p>
                                                </div>
                                                <div className="space-y-1 text-right">
                                                    <p className="text-[10px] uppercase text-zinc-600 font-bold tracking-widest">Tools Triggered</p>
                                                    <div className="flex flex-wrap gap-1 justify-end">
                                                        {item.tools?.length > 0 ? item.tools.map(t => (
                                                            <code key={t} className="text-[9px] bg-zinc-800 text-primary px-1.5 py-0.5 rounded border border-white/5">{t}</code>
                                                        )) : <span className="text-[10px] text-zinc-700">None</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="pt-4 border-t border-white/5">
                                                <p className="text-[10px] uppercase text-zinc-600 font-bold tracking-widest mb-1">AI Response</p>
                                                <p className="text-xs text-zinc-500 line-clamp-2">{item.ai_response || "N/A"}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Optimization Data */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* Tool Frequency */}
                        <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6">
                            <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest">Core Function Usage</h3>
                            <div className="space-y-4">
                                {data.tools.map((tool) => (
                                    <div key={tool.tool} className="flex items-center justify-between">
                                        <code className="text-[10px] text-primary bg-primary/5 px-2 py-1 rounded border border-primary/10">
                                            {tool.tool}
                                        </code>
                                        <span className="text-xs font-mono text-zinc-400">{tool.count} calls</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Exercise Trends */}
                        <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6">
                            <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest">Query Density</h3>
                            <div className="space-y-4">
                                {data.queryAnalytics.topExercises.map((ex, i) => (
                                    <div key={ex.name} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] text-zinc-700 font-mono">0{i + 1}</span>
                                            <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors">{ex.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono text-zinc-500">{ex.count}</span>
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Database Sync Recovery */}
                        <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 overflow-hidden relative">
                            <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest">Normalization Matrix</h3>
                            <div className="space-y-4 relative z-10">
                                {data.queryAnalytics.typoPatterns.slice(0, 8).map((pattern, i) => (
                                    <div key={i} className="flex items-center justify-between text-[11px]">
                                        <div className="flex items-center gap-2">
                                            <span className="text-zinc-500 italic line-through opacity-50">{pattern.typo}</span>
                                            <span className="text-primary/50">→</span>
                                            <span className="text-zinc-200 font-bold">{pattern.corrected}</span>
                                        </div>
                                        <span className="text-[9px] font-mono text-zinc-600">{pattern.frequency}x</span>
                                    </div>
                                ))}
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -z-0" />
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}

function StatBox({ icon, label, value, trend, color }: {
    icon: React.ReactNode,
    label: string,
    value: string,
    trend: string,
    color: 'emerald' | 'indigo' | 'rose' | 'amber'
}) {
    const colors = {
        emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    };

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className="p-6 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-sm"
        >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${colors[color]} mb-4`}>
                {icon}
            </div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.15em] mb-1">{label}</p>
            <div className="flex items-end gap-2">
                <p className="text-2xl font-bold text-white tracking-tighter">{value}</p>
                <p className="text-[10px] text-zinc-600 font-mono mb-1">{trend}</p>
            </div>
        </motion.div>
    );
}
