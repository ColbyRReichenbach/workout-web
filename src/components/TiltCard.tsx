"use client";

import { memo } from "react";

interface TiltCardProps {
    children: React.ReactNode;
    className?: string;
    glowColor?: string;
}

export const TiltCard = memo(function TiltCard({ children, className, glowColor = "shadow-primary/10" }: TiltCardProps) {
    return (
        <div
            className={`
                relative bg-card border border-border
                shadow-sm hover:shadow-xl ${glowColor}
                hover:border-foreground/10
                transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]
                hover:scale-[1.02]
                active:scale-[0.98]
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
        </div>
    );
});
