"use client";

import { motion } from "framer-motion";

interface TiltCardProps {
    children: React.ReactNode;
    className?: string;
    glowColor?: string;
}

export function TiltCard({ children, className, glowColor = "shadow-primary/10" }: TiltCardProps) {
    return (
        <motion.div
            style={{
                transformStyle: "preserve-3d",
            }}
            whileHover={{ y: -4, scale: 1.01 }}
            className={`
                relative transition-all duration-300 ease-out
                bg-white/70 backdrop-blur-xl border border-black/[0.03]
                hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] ${glowColor}
                hover:border-black/10
                ${className}
            `}
        >
            {/* Subtle Pulse Accent on Hover */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10 h-full">
                {children}
            </div>
        </motion.div>
    );
}
