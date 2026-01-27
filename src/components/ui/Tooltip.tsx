/**
 * Tooltip Component
 * 
 * Standardized tooltip for consistent display across charts and interactive elements.
 * Features a dark aesthetic that works well in both light and dark modes.
 */

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface TooltipProps {
    children: ReactNode
    className?: string
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

export function Tooltip({ children, className, position = 'top' }: TooltipProps) {
    const positionClasses = {
        top: '-translate-x-1/2 left-1/2 bottom-full mb-3',
        bottom: '-translate-x-1/2 left-1/2 top-full mt-3',
        left: '-translate-y-1/2 top-1/2 right-full mr-3',
        right: '-translate-y-1/2 top-1/2 left-full ml-3',
        center: '-translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2',
    }

    return (
        <div
            className={cn(
                "absolute z-50 bg-stone-900/90 backdrop-blur-md border border-stone-800 text-white p-4 rounded-2xl shadow-2xl pointer-events-none whitespace-nowrap overflow-visible",
                positionClasses[position],
                className
            )}
        >
            {children}
        </div>
    )
}

/**
 * ChartTooltipHeader Component
 */
export function TooltipHeader({ children, className }: { children: ReactNode, className?: string }) {
    return (
        <div className={cn("text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1", className)}>
            {children}
        </div>
    )
}

/**
 * ChartTooltipValue Component
 */
export function TooltipValue({ children, className, unit }: { children: ReactNode, className?: string, unit?: string }) {
    return (
        <div className={cn("text-lg font-serif text-white flex items-baseline gap-1", className)}>
            {children}
            {unit && <span className="text-xs text-stone-400 font-sans">{unit}</span>}
        </div>
    )
}
