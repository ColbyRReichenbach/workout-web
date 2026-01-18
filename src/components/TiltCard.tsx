"use client";

import { motion } from "framer-motion";
import { memo } from "react";

interface TiltCardProps {
    children: React.ReactNode;
    className?: string;
    glowColor?: string;
}

export const TiltCard = memo(function TiltCard({ children, className, glowColor = "shadow-primary/10" }: TiltCardProps) {
    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`
                relative bg-white/90 border border-black/[0.03]
                shadow-sm hover:shadow-xl ${glowColor}
                hover:border-black/10
                will-change-transform
                ${className}
            `}
            style={{
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden'
            }}
        >
            <div className="relative z-10 h-full">
                {children}
            </div>
        </motion.div>
    );
});
