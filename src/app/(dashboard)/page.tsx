"use client";

import { motion } from "framer-motion";
import {
  Activity, Calendar, Flame,
  Zap, List, CalendarDays, HeartPulse, ArrowRight
} from "lucide-react";
import AiCoach from "@/components/AiCoach";
import { DayCard, DayDetailModal } from "@/components/WeeklySchedule";
import { TiltCard } from "@/components/TiltCard";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

// Weekly schedule template based on master plan
const weeklyTemplate = [
  { day: "Monday", title: "Lower Body Heavy", type: "Strength" },
  { day: "Tuesday", title: "Upper Body Hypertrophy", type: "Hypertrophy" },
  { day: "Wednesday", title: "Zone 2 Cardio + Core", type: "Cardio" },
  { day: "Thursday", title: "Active Recovery", type: "Recovery" },
  { day: "Friday", title: "Full Body Power", type: "Power" },
  { day: "Saturday", title: "Long Run / Ruck", type: "Endurance" },
  { day: "Sunday", title: "Total Rest", type: "Rest" },
];

export default function Home() {
  const router = useRouter();
  const [currentWeek, setCurrentWeek] = useState(1);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [completedDays, setCompletedDays] = useState<Set<string>>(new Set());
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [protocol, setProtocol] = useState<any[]>(weeklyTemplate);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const streak = 3;
  const completion = 85;

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      // Fetch Profile
      const { data: profile, error: profileError } = await supabase.from('profiles').select('current_week, current_phase, height, weight_lbs').single();

      // If no profile exists (new user from OAuth), redirect to onboarding
      if (!profile || profileError) {
        router.push('/onboarding');
        return;
      }

      // If profile exists but is incomplete, also redirect to onboarding
      if (!profile.height || !profile.weight_lbs) {
        router.push('/onboarding');
        return;
      }

      setCurrentWeek(profile.current_week || 1);
      setCurrentPhase(profile.current_phase || 1);

      // Fetch Library to get titles for the week
      const { data: library } = await supabase.from('workout_library').select('program_data').single();
      if (library && library.program_data?.phases) {
        const phases = library.program_data.phases;
        const phaseIdx = (profile?.current_phase || 1) - 1;
        const phase = phases[phaseIdx] || phases[0];

        // Find week relative to phase
        // Phase 1: 1-8, Phase 2: 9-20, etc.
        // For now, simpler: map absolute week to phase weeks
        const absWeek = profile?.current_week || 1;
        const relativeWeekIdx = (absWeek - 1) % (phase.weeks?.length || 4);
        const weekData = phase.weeks?.[relativeWeekIdx];

        if (weekData?.days) {
          const dynamicProtocol = weekData.days.map((d: any) => ({
            day: d.day,
            title: d.title,
            type: d.segments?.[0]?.type || "Training"
          }));
          setProtocol(dynamicProtocol);
        }
      }

      // Fetch Logs for the user's active week
      const { data: logs } = await supabase
        .from('logs')
        .select('*')
        .eq('week_number', profile?.current_week || 1);

      const daysWithLogs = new Set(logs?.map(l => l.day_name) || []);
      setCompletedDays(daysWithLogs);
      setAllLogs(logs || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Determine today accurately
  const jsDay = new Date().getDay();
  const todayIndex = jsDay === 0 ? 6 : jsDay - 1;
  const todayName = protocol[todayIndex]?.day || "Monday";

  const handleDayClick = (day: typeof weeklyTemplate[0]) => {
    setSelectedDay(day);
    setModalOpen(true);
  };

  const getLogsForDay = (dayName: string) => {
    return allLogs.filter(l => l.day_name === dayName);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-stone-400 font-serif animate-pulse text-xl italic text-center">
          Synchronizing Pulse Rhythm...<br />
          <span className="text-[10px] font-bold uppercase tracking-widest mt-2 block">Accessing encrypted athlete data</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16 py-4">
      {/* Day Detail Modal */}
      <DayDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        day={selectedDay}
        isDone={selectedDay ? completedDays.has(selectedDay.day) : false}
        isToday={selectedDay ? selectedDay.day === todayName : false}
        logs={selectedDay ? getLogsForDay(selectedDay.day) : []}
      />

      {/* Hero Section */}
      <header className="flex flex-col md:flex-row justify-between items-end gap-10">
        <div className="space-y-4 max-w-2xl slide-in">
          <div className="flex items-center gap-2 text-primary">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-60">System Active • Week {currentWeek}</span>
          </div>
          <h1 className="font-serif text-7xl md:text-9xl text-stone-900 leading-[0.85] tracking-tighter">
            Current Rhythm
          </h1>
          <p className="text-stone-500 text-xl font-light italic">
            You are currently in Phase {currentPhase}, Week {currentWeek}. Your biometric pulse is optimal.
          </p>
        </div>

        <Link
          href="/workout"
          className="group relative bg-primary text-white pl-10 pr-6 py-6 rounded-[32px] font-bold text-lg flex items-center gap-6 transition-all btn-pro shadow-[0_20px_40px_-10px_rgba(239,68,68,0.3)] hover:shadow-[0_25px_50px_-12px_rgba(239,68,68,0.5)] active:scale-[0.98]"
        >
          Initiate Today's Pulse
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-all group-hover:rotate-[-10deg]">
            <ArrowRight size={20} />
          </div>
        </Link>
      </header>

      {/* Analytics Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {[
          { icon: Calendar, label: "Streak", value: streak, unit: "Days", color: "text-red-500", bg: "bg-red-500/5", glow: "shadow-red-500/10" },
          { icon: Activity, label: "Volume", value: "42k", unit: "lb", color: "text-orange-500", bg: "bg-orange-500/5", glow: "shadow-orange-500/10" },
          { icon: Flame, label: "Burn", value: "840", unit: "kcal", color: "text-amber-500", bg: "bg-amber-500/5", glow: "shadow-amber-500/10" },
          { icon: List, label: "Flow", value: completion, unit: "%", color: "text-stone-500", bg: "bg-stone-500/5", glow: "shadow-stone-900/5" },
        ].map((m, i) => (
          <TiltCard
            key={i}
            glowColor={m.glow}
            className="group rounded-[40px] p-8 cursor-pointer overflow-hidden"
          >
            {/* Background Icon Watermark */}
            <div className={`absolute -right-8 -bottom-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-200 pointer-events-none ${m.color}`}>
              <m.icon size={140} strokeWidth={1} />
            </div>

            <div className="flex justify-between items-start mb-10 relative z-10">
              <div className={`w-14 h-14 rounded-2xl ${m.bg} ${m.color} flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shadow-sm border border-black/[0.02]`}>
                <m.icon size={24} />
              </div>
              <span className="text-[10px] text-stone-400 uppercase tracking-[0.3em] font-bold opacity-60">{m.label}</span>
            </div>

            <div className="relative z-10">
              <h3 className="text-5xl font-serif text-stone-900 mb-1">
                {m.value} <span className="text-sm text-stone-400 font-sans uppercase tracking-[0.2em] font-bold ml-1">{m.unit}</span>
              </h3>
              <div className="w-8 h-[2px] bg-stone-100 group-hover:w-16 group-hover:bg-primary/20 transition-[width,background-color] duration-300 mt-4" />
            </div>
          </TiltCard>
        ))}
      </motion.div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* Weekly Protocol */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex justify-between items-end border-b border-black/[0.03] pb-6">
            <div>
              <h3 className="font-serif text-4xl text-stone-900 tracking-tight">Weekly Protocol</h3>
              <p className="text-stone-400 text-sm mt-1">Adaptive training schedule based on biometric data.</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400 bg-stone-100/50 px-4 py-2 rounded-full border border-black/5">
              <CalendarDays size={14} className="text-primary" />
              <span>Phase {currentPhase} • Pulse 0{currentWeek}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {protocol.map((day, i) => {
              const isDone = completedDays.has(day.day);
              const isToday = day.day === todayName;
              const isPast = i < todayIndex && !isDone;
              const isFuture = i > todayIndex;

              return (
                <DayCard
                  key={i}
                  day={day}
                  index={i}
                  isToday={isToday}
                  isDone={isDone}
                  isPast={isPast}
                  phase={currentPhase}
                  onClick={() => handleDayClick({ ...day, isFuture })}
                />
              );
            })}
          </div>
        </div>

        {/* Intelligence / Coaching */}
        <div className="lg:col-span-4 space-y-8">
          <div className="border-b border-black/[0.03] pb-6">
            <h3 className="font-serif text-4xl text-stone-900 tracking-tight">Coach AI</h3>
            <p className="text-stone-400 text-sm mt-1">Real-time performance adjustments.</p>
          </div>

          <div className="glass-card border border-white/40 rounded-[48px] p-2 h-[600px] shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <AiCoach />
          </div>
        </div>
      </div>
    </div>
  );
}
