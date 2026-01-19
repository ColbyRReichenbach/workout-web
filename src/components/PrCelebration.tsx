"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";
import { useEffect } from "react";

interface PrCelebrationProps {
    show: boolean;
    onComplete: () => void;
    value: number;
    unit: string;
}

export default function PrCelebration({ show, onComplete, value, unit }: PrCelebrationProps) {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(onComplete, 3000);
            return () => clearTimeout(timer);
        }
    }, [show, onComplete]);

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
                    {/* Background Flash */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { duration: 0.2 } }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-yellow-500/10 backdrop-blur-[2px]"
                    />

                    {/* The Star Badge */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="relative bg-gradient-to-br from-yellow-300 to-yellow-600 p-8 rounded-full shadow-[0_0_100px_rgba(234,179,8,0.5)] border-4 border-white/50"
                    >
                        <Star size={80} className="text-white fill-white" />

                        {/* Particles */}
                        {[...Array(8)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ x: 0, y: 0, opacity: 1 }}
                                animate={{
                                    x: Math.cos(i * 45 * (Math.PI / 180)) * 150,
                                    y: Math.sin(i * 45 * (Math.PI / 180)) * 150,
                                    opacity: 0,
                                    scale: 0.5
                                }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="absolute top-1/2 left-1/2 w-4 h-4 rounded-full bg-yellow-400"
                            />
                        ))}
                    </motion.div>

                    {/* Text */}
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 140, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.2 }}
                        className="absolute text-center"
                    >
                        <h2 className="text-4xl font-serif text-white font-bold drop-shadow-md">New Record!</h2>
                        <p className="text-xl text-yellow-300 font-serif mt-2">{value} {unit}</p>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
