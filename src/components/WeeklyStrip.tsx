"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useState } from "react";

type DayStatus = "pending" | "completed" | "missed" | "active";

// Sample data - in future pass as props
const days = ["M", "T", "W", "T", "F", "S", "S"];

interface WeeklyStripProps {
    statuses: DayStatus[];
}

export default function WeeklyStrip({ statuses }: WeeklyStripProps) {
    // Mock State: Monday-Tuesday done, Wednesday active


    return (
        <div className="w-full flex justify-center mb-8">
            <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-full p-2 flex items-center gap-2 shadow-2xl">
                {days.map((day, idx) => {
                    const status = statuses[idx];
                    const isCompleted = status === "completed";
                    const isActive = status === "active";

                    return (
                        <motion.div
                            key={idx}
                            initial={false}
                            animate={{
                                scale: isActive ? 1.1 : 1,
                                backgroundColor: isCompleted ? "rgba(234, 179, 8, 0.2)" : isActive ? "rgba(59, 130, 246, 0.2)" : "transparent",
                                borderColor: isCompleted ? "rgba(234, 179, 8, 1)" : isActive ? "rgba(59, 130, 246, 1)" : "rgba(255,255,255,0.1)"
                            }}
                            className={`
                    relative h-10 w-10 md:h-12 md:w-12 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors
                    ${status === "pending" ? "text-zinc-500 hover:border-white/30" : "text-white"}
                `}
                        >
                            {/* Active Indicator Dot */}
                            {isActive && (
                                <motion.div
                                    layoutId="active-dot"
                                    className="absolute -bottom-1 h-1 w-1 rounded-full bg-blue-500"
                                />
                            )}

                            {/* Content */}
                            {isCompleted ? (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                >
                                    <Check size={18} className="text-yellow-500" strokeWidth={3} />
                                </motion.div>
                            ) : (
                                <span className={`text-sm font-bold ${isActive ? 'text-blue-400' : ''}`}>{day}</span>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
