"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, memo } from "react";
import { useSettings } from "@/context/SettingsContext";
import { getUnitLabel } from "@/lib/conversions";

interface ChartPoint {
    x: number;
    y: number;
    val: number;
    label?: string;
}

interface MultiChartProps {
    data: number[];
    secondaryData?: number[];
    labels?: string[];
    color?: string;
    secondaryColor?: string;
    height?: number;
    // Units are now handled via context, but we keep props for explicit overrides if needed
    units?: string;
    secondaryUnits?: string;
    title?: string;
}

/**
 * Premium Area Chart with optional secondary correlation line
 */
export const PremiumAreaChart = memo(function PremiumAreaChart({
    data,
    secondaryData,
    height = 250,
    color = "#ef4444",
    secondaryColor = "#1c1917",
    units: propUnits = "",
    secondaryUnits = ""
}: MultiChartProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const { units: systemUnits } = useSettings();

    // Determine effective unit label (prop override > context derived)
    const displayUnits = propUnits || (getUnitLabel(systemUnits, 'weight') === 'kg' ? ' kg' : ' lbs');

    const { points, secondaryPoints } = useMemo(() => {
        if (data.length === 0) return { points: [], secondaryPoints: [] };

        const mainMax = Math.max(...data, 1);
        const mainMin = Math.min(...data);
        const mainRange = mainMax - mainMin || 1;

        // Add padding for stroke visibility (8% padding on each side)
        const pts = data.map((val, i) => ({
            x: 4 + (i / (data.length - 1 || 1)) * 92, // 4-96 range for padding
            y: 8 + ((mainMax - val) / mainRange) * 84, // 8-92 range for padding
            val
        }));

        let sPts: ChartPoint[] = [];
        if (secondaryData && secondaryData.length > 0) {
            const sMax = Math.max(...secondaryData, 1);
            const sMin = Math.min(...secondaryData);
            const sRange = sMax - sMin || 1;
            sPts = secondaryData.map((val, i) => ({
                x: 4 + (i / (secondaryData.length - 1 || 1)) * 92,
                y: 8 + ((sMax - val) / sRange) * 84,
                val
            }));
        }

        return { points: pts, secondaryPoints: sPts };
    }, [data, secondaryData]);

    if (data.length === 0) return <div className="h-full flex items-center justify-center text-muted-foreground italic">No biometric depth available</div>;

    const mainD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
    const secondaryD = secondaryPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');

    // Smart tooltip position calculation
    const getTooltipStyle = () => {
        if (hoveredIndex === null) return {};

        const point = points[hoveredIndex];
        const xPercent = point.x;
        const yPercent = point.y;

        // Calculate smart positioning
        let translateX = '-50%';
        let translateY = '-120%'; // Default: above the point
        const left = `${xPercent}%`;
        const top = `${yPercent}%`;

        // If near top edge, show below
        if (yPercent < 25) {
            translateY = '20%';
        }

        // If near left edge, align to left
        if (xPercent < 15) {
            translateX = '0%';
        }
        // If near right edge, align to right
        else if (xPercent > 85) {
            translateX = '-100%';
        }

        return {
            left,
            top,
            transform: `translate(${translateX}, ${translateY})`
        };
    };

    return (
        <div className="w-full relative h-full group/chart overflow-visible" style={{ height: `${height}px`, willChange: 'transform' }}>
            <svg viewBox="-2 -2 104 104" preserveAspectRatio="none" className="w-full h-full" style={{ overflow: 'visible' }}>
                <defs>
                    <linearGradient id={`areaGradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[8, 29, 50, 71, 92].map(v => (
                    <line key={v} x1="4" y1={v} x2="96" y2={v} stroke="currentColor" className="text-border" strokeWidth="0.1" />
                ))}

                {/* Secondary Line (Correlation) */}
                {secondaryPoints.length > 0 && (
                    <motion.path
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 0.3 }}
                        transition={{ duration: 1.5 }}
                        d={secondaryD}
                        fill="none"
                        stroke={secondaryColor}
                        strokeWidth="0.3"
                        strokeDasharray="1,1"
                    />
                )}

                {/* Main Area Fill */}
                <path
                    d={`M ${points[0]?.x || 4},92 ${mainD} L ${points[points.length - 1]?.x || 96},92 Z`}
                    fill={`url(#areaGradient-${color.replace('#', '')})`}
                    className="transition-opacity duration-500"
                />

                {/* Main Line */}
                <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, ease: "circOut" }}
                    d={mainD}
                    fill="none"
                    stroke={color}
                    strokeWidth="0.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Hover Interaction rects */}
                {points.map((p, i) => {
                    const segmentWidth = 92 / Math.max(data.length - 1, 1);
                    return (
                        <rect
                            key={i}
                            x={Math.max(0, p.x - segmentWidth / 2)}
                            y="0"
                            width={segmentWidth}
                            height="100"
                            fill="transparent"
                            className="cursor-crosshair"
                            onMouseEnter={() => setHoveredIndex(i)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        />
                    );
                })}

                {/* Hover Indicator */}
                {hoveredIndex !== null && (
                    <g className="pointer-events-none">
                        <line x1={points[hoveredIndex].x} y1="0" x2={points[hoveredIndex].x} y2="100" stroke={color} strokeWidth="0.5" strokeDasharray="1,1" strokeOpacity="0.5" />
                        <circle cx={points[hoveredIndex].x} cy={points[hoveredIndex].y} r="1.5" fill="white" stroke={color} strokeWidth="1" />
                        {secondaryPoints[hoveredIndex] && (
                            <circle cx={secondaryPoints[hoveredIndex].x} cy={secondaryPoints[hoveredIndex].y} r="1" fill="white" stroke={secondaryColor} strokeWidth="0.5" />
                        )}
                    </g>
                )}
            </svg>

            {/* Premium Tooltip */}
            <AnimatePresence>
                {hoveredIndex !== null && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 bg-stone-900 text-white shadow-2xl p-4 rounded-xl pointer-events-none min-w-[120px]"
                        style={getTooltipStyle()}
                    >
                        <div className="text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-2">
                            Week {hoveredIndex + 1}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                                <span className="text-lg font-serif">{Math.round(points[hoveredIndex].val)}{displayUnits}</span>
                            </div>
                            {secondaryPoints[hoveredIndex] && (
                                <div className="flex items-center gap-3 opacity-60">
                                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: secondaryColor }} />
                                    <span className="text-sm font-medium">{Math.round(secondaryPoints[hoveredIndex].val)}{secondaryUnits}</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

/**
 * Progression Bar Chart
 */
export const ProgressionBarChart = memo(function ProgressionBarChart({ data, height = 300, color = "bg-primary", units = "" }: MultiChartProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const { units: systemUnits } = useSettings();
    const displayUnits = units || getUnitLabel(systemUnits, 'weight');

    const max = Math.max(...data, 1);
    const totalBars = data.length;

    // Calculate tooltip position class
    const getTooltipPosition = (index: number, barHeightPct: number) => {
        let horizontal = '-translate-x-1/2 left-1/2';

        // If near left edge, align to left
        if (index < 3) {
            horizontal = 'left-0';
        }
        // If near right edge, align to right
        else if (index > totalBars - 4) {
            horizontal = 'right-0';
        }

        // If bar is very tall, show tooltip below top instead of above
        const verticalOffset = barHeightPct > 80 ? 'top-4' : '-top-20';

        return `${horizontal} ${verticalOffset}`;
    };

    return (
        <div className="flex items-end gap-[3px] w-full h-full group/bars overflow-visible" style={{ height: `${height}px` }}>
            {data.map((val, i) => {
                const heightPct = (val / max) * 100;
                const tooltipPos = getTooltipPosition(i, heightPct);

                return (
                    <div
                        key={i}
                        className="flex-1 h-full flex flex-col justify-end group relative cursor-pointer"
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                    >
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${heightPct}%` }}
                            transition={{ duration: 0.8, delay: i * 0.005, ease: "circOut" }}
                            className={`w-full rounded-t-[2px] ${color} transition-all duration-300 relative`}
                            style={{
                                opacity: hoveredIndex === null ? 0.6 : hoveredIndex === i ? 1 : 0.3,
                                boxShadow: hoveredIndex === i ? `0 0 20px -5px ${color === 'bg-primary' ? '#ef4444' : '#1c1917'}` : 'none'
                            }}
                        />
                        <AnimatePresence>
                            {hoveredIndex === i && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className={`absolute ${tooltipPos} bg-stone-900 text-white p-4 rounded-xl shadow-2xl whitespace-nowrap z-50 pointer-events-none`}
                                >
                                    <div className="text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-2">Week {i + 1}</div>
                                    <div className="text-lg font-serif">{val.toLocaleString()} {displayUnits}</div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
});


/**
 * Structural Load Heatmap (Phase 1)
 */
export const StructuralHeatmap = memo(function StructuralHeatmap({ data, readiness }: { data: boolean[], readiness: number[] }) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
        <div className="grid grid-cols-7 gap-2 w-full relative">
            {data.map((active, i) => {
                const readinessVal = readiness[i] || 0;
                const row = Math.floor(i / 7);
                const col = i % 7;

                return (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.005, duration: 0.3 }}
                        className={`aspect-square rounded-xl relative cursor-pointer ${active ? 'bg-primary' : 'bg-muted'}`}
                        style={{
                            opacity: active ? Math.max(0.3, readinessVal / 100) : 1,
                            willChange: 'opacity, transform'
                        }}
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                    >
                        {/* Tooltip */}
                        <AnimatePresence>
                            {hoveredIndex === i && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className={`absolute z-50 bg-foreground text-background p-3 rounded-xl shadow-2xl whitespace-nowrap pointer-events-none ${col < 2 ? 'left-0' : col > 4 ? 'right-0' : 'left-1/2 -translate-x-1/2'
                                        } ${row === 0 ? 'top-full mt-2' : 'bottom-full mb-2'}`}
                                >
                                    <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Day {i + 1}</div>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${active ? 'bg-primary' : 'bg-muted-foreground'}`} />
                                        <span className="text-sm font-serif">{active ? 'Active' : 'Rest'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="w-2 h-2 rounded-full bg-green-500" />
                                        <span className="text-sm font-serif">Ready: {readinessVal}%</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}
        </div>
    );
});

/**
 * PR Proximity Chart (Phase 3)
 */
export const PRProximityChart = memo(function PRProximityChart({ current, target, label, units: propUnits }: { current: number, target: number, label: string, units?: string }) {
    const { units: systemUnits } = useSettings();
    const displayUnits = propUnits || getUnitLabel(systemUnits, 'weight');
    const progress = Math.min((current / target) * 100, 100);
    return (
        <div className="space-y-3 w-full">
            <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
                <span className="text-sm font-serif text-foreground">{current} / {target} {displayUnits}</span>
            </div>
            <div className="h-4 bg-muted rounded-full overflow-hidden relative">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "circOut" }}
                    className="h-full bg-primary relative"
                    style={{ willChange: 'width' }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 animate-pulse" />
                </motion.div>
                <div className="absolute top-1/2 right-4 -translate-y-1/2 text-[8px] font-bold text-stone-400 italic">
                    {progress.toFixed(1)}%
                </div>
            </div>
        </div>
    );
});

/**
 * Recovery Index Chart
 */
export const RecoveryIndexChart = memo(function RecoveryIndexChart({ stress, recovery, height = 250 }: { stress: number[], recovery: number[], height?: number }) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const maxStress = Math.max(...stress, 1);
    const maxRecovery = Math.max(...recovery, 1);

    // Add padding (4-96 for x, 8-92 for y)
    const { stressPoints, recPoints } = useMemo(() => ({
        stressPoints: stress.map((s, i) => ({
            x: 4 + (i / Math.max(stress.length - 1, 1)) * 92,
            y: 8 + (1 - s / maxStress) * 84,
            val: s
        })),
        recPoints: recovery.map((r, i) => ({
            x: 4 + (i / Math.max(recovery.length - 1, 1)) * 92,
            y: 8 + (1 - r / maxRecovery) * 84,
            val: r
        }))
    }), [stress, recovery, maxStress, maxRecovery]);

    const stressD = stressPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
    const recD = recPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');

    // Smart tooltip positioning
    const getTooltipStyle = () => {
        if (hoveredIndex === null) return {};

        const xPercent = stressPoints[hoveredIndex].x;
        const yPercent = Math.min(stressPoints[hoveredIndex].y, recPoints[hoveredIndex].y);

        let translateX = '-50%';
        let translateY = '-120%';

        if (yPercent < 25) translateY = '20%';
        if (xPercent < 15) translateX = '0%';
        else if (xPercent > 85) translateX = '-100%';

        return {
            left: `${xPercent}%`,
            top: `${yPercent}%`,
            transform: `translate(${translateX}, ${translateY})`
        };
    };

    return (
        <div className="relative w-full overflow-visible" style={{ height: `${height}px`, willChange: 'transform' }}>
            <svg viewBox="-2 -2 104 104" preserveAspectRatio="none" className="w-full h-full" style={{ overflow: 'visible' }}>
                {/* Recovery fill */}
                <path d={`M ${recPoints[0]?.x || 4},92 ${recD} L ${recPoints[recPoints.length - 1]?.x || 96},92 Z`} fill="#0ea5e9" fillOpacity="0.1" />
                <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1 }}
                    d={recD}
                    fill="none"
                    stroke="#0ea5e9"
                    strokeWidth="0.4"
                    strokeDasharray="1,1"
                />

                {/* Stress fill */}
                <path d={`M ${stressPoints[0]?.x || 4},92 ${stressD} L ${stressPoints[stressPoints.length - 1]?.x || 96},92 Z`} fill="#ef4444" fillOpacity="0.1" />
                <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1 }}
                    d={stressD}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="0.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Hover interaction rects */}
                {stress.map((_, i) => {
                    const segmentWidth = 92 / Math.max(stress.length - 1, 1);
                    return (
                        <rect
                            key={i}
                            x={Math.max(0, stressPoints[i].x - segmentWidth / 2)}
                            y="0"
                            width={segmentWidth}
                            height="100"
                            fill="transparent"
                            className="cursor-crosshair"
                            onMouseEnter={() => setHoveredIndex(i)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        />
                    );
                })}

                {/* Hover indicators */}
                {hoveredIndex !== null && (
                    <g className="pointer-events-none">
                        <line x1={stressPoints[hoveredIndex].x} y1="0" x2={stressPoints[hoveredIndex].x} y2="100" stroke="#78716c" strokeWidth="0.5" strokeDasharray="1,1" strokeOpacity="0.5" />
                        <circle cx={stressPoints[hoveredIndex].x} cy={stressPoints[hoveredIndex].y} r="1.5" fill="white" stroke="#ef4444" strokeWidth="1" />
                        <circle cx={recPoints[hoveredIndex].x} cy={recPoints[hoveredIndex].y} r="1.5" fill="white" stroke="#0ea5e9" strokeWidth="1" />
                    </g>
                )}
            </svg>

            {/* Tooltip */}
            <AnimatePresence>
                {hoveredIndex !== null && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 bg-stone-900 text-white p-4 rounded-xl shadow-2xl pointer-events-none min-w-[140px]"
                        style={getTooltipStyle()}
                    >
                        <div className="text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-2">
                            Week {hoveredIndex + 1}
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                                    <span className="text-[10px] text-stone-400 uppercase">Stress</span>
                                </div>
                                <span className="text-lg font-serif">{Math.round(stress[hoveredIndex])}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0" />
                                    <span className="text-[10px] text-stone-400 uppercase">Recovery</span>
                                </div>
                                <span className="text-lg font-serif">{Math.round(recovery[hoveredIndex])}%</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

/**
 * Power Density Scatter with Tooltips
 */
export const PowerDensityChart = memo(function PowerDensityChart({ data, height = 250 }: { data: { x: number, y: number }[], height?: number }) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const { maxX, maxY } = useMemo(() => ({
        maxX: Math.max(...data.map(d => d.x), 1),
        maxY: Math.max(...data.map(d => d.y), 1)
    }), [data]);

    if (data.length === 0) return null;

    return (
        <div className="relative w-full overflow-visible" style={{ height: `${height}px`, willChange: 'transform' }}>
            <svg viewBox="-2 -2 104 104" preserveAspectRatio="none" className="w-full h-full" style={{ overflow: 'visible' }}>
                {/* Trend line */}
                <motion.line
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1 }}
                    x1="0" y1="90" x2="100" y2="10"
                    stroke="#ef4444" strokeWidth="0.5" strokeDasharray="2,2" strokeOpacity="0.3"
                />

                {/* Data points */}
                {data.map((d, i) => (
                    <motion.circle
                        key={i}
                        initial={{ opacity: 0, r: 0 }}
                        animate={{
                            opacity: hoveredIndex === null ? 0.6 : hoveredIndex === i ? 1 : 0.2,
                            r: hoveredIndex === i ? 2 : 1
                        }}
                        transition={{ duration: 0.2, delay: i * 0.01 }}
                        cx={(d.x / maxX) * 100}
                        cy={100 - (d.y / maxY) * 100}
                        fill="#ef4444"
                        className="cursor-crosshair"
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                    />
                ))}
            </svg>

            {/* Tooltip */}
            <AnimatePresence>
                {hoveredIndex !== null && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 bg-stone-900 border border-stone-800 p-3 rounded-xl shadow-2xl pointer-events-none"
                        style={{
                            left: `${(data[hoveredIndex].x / maxX) * 100}%`,
                            top: `${100 - (data[hoveredIndex].y / maxY) * 100}%`,
                            transform: 'translate(-50%, -120%)'
                        }}
                    >
                        <div className="text-[8px] font-bold text-stone-500 uppercase tracking-widest mb-1">Week {data[hoveredIndex].x + 1}</div>
                        <div className="text-lg font-serif text-white">{Math.round(data[hoveredIndex].y)} <span className="text-xs text-stone-400">pts</span></div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});
