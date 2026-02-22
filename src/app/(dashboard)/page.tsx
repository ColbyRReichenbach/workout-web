"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import {
  Activity, Calendar, Flame, CalendarDays,
  ArrowRight, Scale, ChevronLeft, ChevronRight,
  ChevronDown
} from "lucide-react";
import { DayCard, DayDetailModal } from "@/components/WeeklySchedule";
import { TiltCard } from "@/components/TiltCard";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { ChatErrorBoundary } from "@/components/ChatErrorBoundary";
import { BiometricsModal } from "@/components/BiometricsModal";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { WorkoutDay, ProtocolDay, WorkoutLog, UserProfile } from "@/lib/types";
import { useSettings } from "@/context/SettingsContext";
import { getUnitLabel } from "@/lib/conversions";
import { calculateAbsoluteWeek } from "@/lib/dateUtils";
import { DEMO_USER_ID } from "@/lib/constants";

// Dynamic import for AiCoach with loading skeleton
const AiCoach = dynamic(() => import("@/components/AiCoach"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col h-full p-4 animate-pulse">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-12 w-12 rounded-2xl bg-muted" />
        <div className="space-y-2">
          <div className="h-5 w-24 bg-muted rounded" />
          <div className="h-3 w-32 bg-muted rounded" />
        </div>
      </div>
      <div className="flex-1 space-y-4">
        <div className="h-4 w-3/4 bg-muted rounded" />
        <div className="h-4 w-1/2 bg-muted rounded" />
      </div>
      <div className="h-16 w-full bg-muted rounded-3xl mt-auto" />
    </div>
  ),
});

// Types for workout data




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

const getHighestWeek = (logs: WorkoutLog[]) => {
  if (!logs || logs.length === 0) return 1;
  return Math.max(...logs.map(l => l.week_number));
};

export default function Home() {
  const router = useRouter();
  const [currentWeek, setCurrentWeek] = useState(1);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [completedDays, setCompletedDays] = useState<Set<string>>(new Set());
  const [allLogs, setAllLogs] = useState<WorkoutLog[]>([]);
  const [protocol, setProtocol] = useState<ProtocolDay[]>(weeklyTemplate);
  const [loading, setLoading] = useState(true);
  const { units } = useSettings();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [totalWeeks, setTotalWeeks] = useState(1);
  const [allProgramWeeks, setAllProgramWeeks] = useState<{ week: number; phase: number }[]>([]);

  // Modal State
  const [selectedDay, setSelectedDay] = useState<ProtocolDay | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [biometricsOpen, setBiometricsOpen] = useState(false);



  const searchParams = useSearchParams();
  const targetWeekParam = searchParams.get('week');

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      console.log("[Dashboard] Fetching data for week:", targetWeekParam);

      // Parallelize initial data fetch
      const [
        { data: userResponse },
        { data: library }
      ] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('workout_library').select('program_data').single()
      ]);

      const user = userResponse?.user;

      // Fetch profile using retrieved user
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('current_week, current_phase, height, weight_lbs, program_start_date')
        .eq('id', user?.id || DEMO_USER_ID)
        .single();

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

      setUserProfile(profile as UserProfile);

      // --- DYNAMIC TRACKING LOGIC ---
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Normalize to local midnight

      // Use program_start_date or fallback to today
      const startDate = profile.program_start_date ? new Date(profile.program_start_date) : new Date();
      startDate.setHours(0, 0, 0, 0); // Normalize start to midnight

      const msPerDay = 1000 * 60 * 60 * 24;
      // Calculate days since start (0 = Day 1, 6 = Day 7, etc.)
      const diffTime = now.getTime() - startDate.getTime();
      let daysSinceStart = Math.floor(diffTime / msPerDay);
      if (daysSinceStart < 0) daysSinceStart = 0; // Prevent negative days if start date is in the future

      // Calculate the true absolute week and today index
      const absoluteCurrentWeek = calculateAbsoluteWeek(startDate, now);
      const todayIndex = daysSinceStart % 7;

      // Determine Viewed Week
      let viewedWeek = absoluteCurrentWeek;
      if (targetWeekParam) {
        const parsed = parseInt(targetWeekParam);
        if (!isNaN(parsed)) viewedWeek = parsed;
      }

      // Dynamic Weekday Array Generation
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const startDayOfWeek = startDate.getDay(); // 0-6 (Sun-Sat)
      const dynamicDaysOfTheWeek = Array.from({ length: 7 }, (_, i) => {
        return dayNames[(startDayOfWeek + i) % 7];
      });

      // --- END DYNAMIC TRACKING LOGIC ---

      // Fetch ALL logs for this user to track streak across weeks
      const currentUserId = user?.id || DEMO_USER_ID;
      // Fetch recent logs for streak calculation
      const { data: recentLogsData } = await supabase
        .from('logs')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(500);

      const recentLogs = (recentLogsData as WorkoutLog[]) || [];

      // Fetch logs for the SPECIFIC viewed week
      const { data: weekLogsData } = await supabase
        .from('logs')
        .select('*')
        .eq('user_id', currentUserId)
        .eq('week_number', viewedWeek);

      const weekLogs = (weekLogsData as WorkoutLog[]) || [];

      // Merge and Dedupe
      const logMap = new Map<string, WorkoutLog>();
      recentLogs.forEach(l => logMap.set(l.id, l));
      weekLogs.forEach(l => logMap.set(l.id, l));
      const logs = Array.from(logMap.values());

      setCurrentWeek(viewedWeek);
      // Phase will be recalculated below based on library structure

      if (library && library.program_data?.phases) {
        const phases = library.program_data.phases;

        // Find Phase for Viewed Week
        let phaseIdx = 0;
        let weekCount = 0;
        for (let i = 0; i < phases.length; i++) {
          const pWeeks = phases[i].weeks?.length || 4;
          if (viewedWeek <= weekCount + pWeeks) {
            phaseIdx = i;
            break;
          }
          weekCount += pWeeks;
        }

        console.log(`[Dashboard] Calculated Phase ${phaseIdx + 1} for Week ${viewedWeek}`);
        setCurrentPhase(phaseIdx + 1);

        const phase = phases[phaseIdx] || phases[0];
        const relativeWeekIdx = (viewedWeek - 1) - weekCount;

        const weekData = phase.weeks?.[relativeWeekIdx];

        if (weekData?.days) {
          const dynamicProtocol = weekData.days.map((d: WorkoutDay, i: number) => {
            let isFuture = false;
            if (viewedWeek > absoluteCurrentWeek) {
              isFuture = true;
            } else if (viewedWeek === absoluteCurrentWeek) {
              isFuture = i > todayIndex;
            }

            return {
              day: dynamicDaysOfTheWeek[i], // Override generic "Day X" or hardcoded Monday-Sunday with their dynamic day
              title: d.title,
              type: d.segments?.[0]?.type || "Training",
              isFuture: isFuture
            };
          });
          setProtocol(dynamicProtocol);
        }

        // Calculate total weeks and options for dropdown
        let total = 0;
        const options: { week: number; phase: number }[] = [];
        phases.forEach((p, pIdx) => {
          const pWeeks = p.weeks?.length || 4;
          for (let w = 1; w <= pWeeks; w++) {
            total++;
            options.push({ week: total, phase: pIdx + 1 });
          }
        });
        setTotalWeeks(total);
        setAllProgramWeeks(options);
      }

      // Filter logs for the VIEWED week
      const currentWeekLogs = logs.filter(l => l.week_number === viewedWeek);
      const daysWithLogs = new Set<string>(currentWeekLogs.map((l: WorkoutLog) => l.day_name));
      setCompletedDays(daysWithLogs);
      setAllLogs(logs);
      setLoading(false);
    }
    fetchData();
  }, [router, targetWeekParam]);

  // Determine today accurately
  const jsDay = new Date().getDay();
  const todayIndex = jsDay === 0 ? 6 : jsDay - 1;
  const todayName = protocol[todayIndex]?.day || "Monday";

  const handleDayClick = (day: ProtocolDay) => {
    setSelectedDay(day);
    setModalOpen(true);
  };

  const getLogsForDay = (dayName: string) => {
    const filtered = allLogs.filter(l => l.day_name === dayName && l.week_number === currentWeek);
    console.log(`[Dashboard] Filtering logs for ${dayName}, Week ${currentWeek}. Found ${filtered.length} entries.`);
    return filtered;
  };

  // Calculate real stats
  const { streak, totalVolume } = useMemo(() => {
    const vol = allLogs.reduce((acc, log) => {
      const pd = log.performance_data || {};
      if (pd.sets && Array.isArray(pd.sets)) {
        return acc + pd.sets.reduce((sAcc: number, s: { weight?: number; reps?: number }) => sAcc + ((Number(s.weight) || 0) * (Number(s.reps) || 0)), 0);
      }
      return acc + ((Number(pd.weight) || 0) * (Number(pd.reps) || 0));
    }, 0);

    const completion = Math.round((completedDays.size / 7) * 100);

    // Protocol-Based Streak (Chain Logic)
    // Map logs to an absolute integer based on their diff from the start date
    const loggedAbsIndices = new Set(allLogs.map(l => {
      if (!l.date) return -1;
      const logDate = new Date(l.date);
      logDate.setHours(0, 0, 0, 0);

      // Start date was calculated above, but we memoize this block so we recalculate
      const pStartDate = userProfile?.program_start_date ? new Date(userProfile.program_start_date) : new Date();
      pStartDate.setHours(0, 0, 0, 0);

      const msPerDay = 1000 * 60 * 60 * 24;
      const daysDiff = Math.floor((logDate.getTime() - pStartDate.getTime()) / msPerDay);
      return daysDiff >= 0 ? daysDiff : -1;
    }));

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const msPerDay = 1000 * 60 * 60 * 24;

    const pStartDate = userProfile?.program_start_date ? new Date(userProfile.program_start_date) : new Date();
    pStartDate.setHours(0, 0, 0, 0);

    const currentAbsIndex = Math.max(0, Math.floor((now.getTime() - pStartDate.getTime()) / msPerDay));

    let currentStreakCount = 0;
    let anchorIdx = -1;

    // Check if Today or Yesterday is done to keep the streak alive
    if (loggedAbsIndices.has(currentAbsIndex)) {
      anchorIdx = currentAbsIndex;
    } else if (loggedAbsIndices.has(currentAbsIndex - 1)) {
      anchorIdx = currentAbsIndex - 1;
    }

    if (anchorIdx !== -1) {
      currentStreakCount = 1;
      let check = anchorIdx - 1;
      // Streak breaks if ANY day in the protocol is missing
      while (check >= 0 && loggedAbsIndices.has(check)) {
        currentStreakCount++;
        check--;
      }
    }

    return {
      streak: currentStreakCount,
      totalVolume: vol,
      totalCompletion: completion
    };
  }, [allLogs, completedDays, userProfile]);

  const displayVolume = useMemo(() => {
    if (totalVolume === 0) return "0";
    const val = units === 'metric' ? totalVolume * 0.453592 : totalVolume;
    return val > 1000 ? `${(val / 1000).toFixed(1)}k` : Math.round(val).toString();
  }, [totalVolume, units]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };



  const handlePrevWeek = () => {
    if (currentWeek > 1) {
      router.push(`/?week=${currentWeek - 1}`);
    }
  };

  const handleNextWeek = () => {
    router.push(`/?week=${currentWeek + 1}`);
  };

  const handleWeekChange = (w: number) => {
    router.push(`/?week=${w}`);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-muted-foreground font-serif animate-pulse text-xl italic text-center">
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
        currentWeek={currentWeek}
      />

      {/* Hero Section */}
      <header className="flex flex-col md:flex-row justify-between items-end gap-10">
        <div className="space-y-4 max-w-2xl slide-in">
          <div className="flex items-center gap-2 text-primary">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-60">System Active • Week {currentWeek}</span>
          </div>
          <h1 className="font-serif text-7xl md:text-9xl text-foreground leading-[0.85] tracking-tighter">
            Current Rhythm
          </h1>
          <p className="text-muted-foreground text-xl font-light italic">
            You are currently in Phase {currentPhase}, Week {currentWeek}. Your biometric pulse is optimal.
          </p>
        </div>

        <Link
          href="/workout"
          className="group relative bg-primary text-primary-foreground pl-10 pr-6 py-6 rounded-[32px] font-bold text-lg flex items-center gap-6 transition-all btn-pro shadow-[0_20px_40px_-10px_rgba(239,68,68,0.3)] hover:shadow-[0_25px_50px_-12px_rgba(239,68,68,0.5)] active:scale-[0.98]"
        >
          Initiate Today&apos;s Pulse
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
          {
            icon: Activity,
            label: "Volume",
            value: displayVolume,
            unit: getUnitLabel(units, 'weight'),
            color: "text-orange-500",
            bg: "bg-orange-500/5",
            glow: "shadow-orange-500/10"
          },
          { icon: Flame, label: "Burn", value: totalVolume > 0 ? Math.round(totalVolume * 0.05) : "0", unit: "kcal", color: "text-amber-500", bg: "bg-amber-500/5", glow: "shadow-amber-500/10" },
          {
            icon: Scale,
            label: "Vitals",
            value: "Sync",
            unit: "Capture",
            color: "text-primary",
            bg: "bg-primary/5",
            glow: "shadow-primary/10",
            onClick: () => setBiometricsOpen(true)
          },
        ].map((m, i) => (
          <TiltCard
            key={i}
            glowColor={m.glow}
            onClick={m.onClick}
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
              <span className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-bold opacity-60">{m.label}</span>
            </div>

            <div className="relative z-10">
              <h3 className="text-5xl font-serif text-foreground mb-1">
                {m.value} <span className="text-sm text-muted-foreground font-sans uppercase tracking-[0.2em] font-bold ml-1">{m.unit}</span>
              </h3>
              <div className="w-8 h-[2px] bg-muted group-hover:w-16 group-hover:bg-primary/20 transition-[width,background-color] duration-300 mt-4" />
            </div>
          </TiltCard>
        ))}
      </motion.div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* Weekly Protocol */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex justify-between items-end border-b border-border pb-6">
            <div>
              <h3 className="font-serif text-4xl text-foreground tracking-tight">Weekly Protocol</h3>
              <p className="text-muted-foreground text-sm mt-1">Adaptive training schedule based on biometric data.</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-muted/50 rounded-full border border-border p-1">
                <button
                  onClick={handlePrevWeek}
                  disabled={currentWeek <= 1}
                  className="p-2 hover:bg-muted rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="relative group px-2">
                  <select
                    value={currentWeek}
                    onChange={(e) => handleWeekChange(Number(e.target.value))}
                    className="appearance-none bg-transparent pl-3 pr-8 py-1.5 text-[10px] font-bold uppercase tracking-[0.3em] font-sans focus:outline-none cursor-pointer"
                  >
                    {allProgramWeeks.map((w) => (
                      <option key={w.week} value={w.week} className="text-black bg-white">
                        Phase {w.phase} • Pulse {w.week < 10 ? `0${w.week}` : w.week}
                      </option>
                    ))}
                    {/* If viewedWeek is beyond program data, add it as an option */}
                    {currentWeek > totalWeeks && (
                      <option value={currentWeek} className="text-black bg-white">
                        Phase ? • Pulse {currentWeek}
                      </option>
                    )}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                </div>

                <button
                  onClick={handleNextWeek}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="hidden md:flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground bg-muted/50 px-4 py-2.5 rounded-full border border-border">
                <CalendarDays size={14} className="text-primary" />
                <span>Rhythm Cycle</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {protocol.map((day, i) => (
              <DayCard
                key={day.day}
                day={day}
                isToday={todayName === day.day && (!window.location.search.includes('week') || currentWeek === (allLogs.length > 0 ? getHighestWeek(allLogs) : 1))}
                // Quick hack: If URL has week param, don't show today unless it matches? 
                // Better: Store 'realCurrentWeek' in state.
                isDone={completedDays.has(day.day)}
                isPast={i < todayIndex && !completedDays.has(day.day)}
                phase={currentPhase}
                currentWeek={currentWeek}
                onClick={() => handleDayClick(day)}
              />
            ))}
          </div>
        </div>

        {/* Intelligence / Coaching */}
        <div className="lg:col-span-4 space-y-8">
          <div className="border-b border-border pb-6">
            <h3 className="font-serif text-4xl text-foreground tracking-tight">Coach AI</h3>
            <p className="text-muted-foreground text-sm mt-1">Real-time performance adjustments.</p>
          </div>

          <div className="glass-card border border-white/40 rounded-[48px] p-2 h-[600px] shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <ChatErrorBoundary>
              <AiCoach />
            </ChatErrorBoundary>
          </div>
        </div>
      </div>
      <BiometricsModal isOpen={biometricsOpen} onClose={() => setBiometricsOpen(false)} />
    </div>
  );
}
