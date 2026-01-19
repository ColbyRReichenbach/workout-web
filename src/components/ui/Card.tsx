/**
 * Card Component
 * 
 * Standardized card container for consistent styling across the application.
 * Consolidates the various card patterns used throughout (glass-card, bg-card, etc.)
 */

import { cn } from "@/lib/utils"
import { ReactNode } from "react"

type CardVariant = 'default' | 'glass' | 'outline' | 'elevated'
type CardSize = 'sm' | 'md' | 'lg' | 'xl'
type CardRadius = 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'

interface CardProps {
    children: ReactNode
    variant?: CardVariant
    size?: CardSize
    radius?: CardRadius
    className?: string
    as?: 'div' | 'section' | 'article'
}

const variantStyles: Record<CardVariant, string> = {
    default: 'bg-card border border-border shadow-sm',
    glass: 'bg-card/50 border border-border backdrop-blur-xl shadow-lg',
    outline: 'bg-transparent border-2 border-border',
    elevated: 'bg-card border border-border shadow-xl shadow-black/5',
}

const sizeStyles: Record<CardSize, string> = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-12',
}

const radiusStyles: Record<CardRadius, string> = {
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
    '2xl': 'rounded-[32px]',
    '3xl': 'rounded-[48px]',
    full: 'rounded-full',
}

export function Card({
    children,
    variant = 'default',
    size = 'md',
    radius = 'xl',
    className,
    as: Component = 'div',
}: CardProps) {
    return (
        <Component
            className={cn(
                variantStyles[variant],
                sizeStyles[size],
                radiusStyles[radius],
                className
            )}
        >
            {children}
        </Component>
    )
}

/**
 * CardHeader Component
 * For use within Card for consistent header styling
 */
interface CardHeaderProps {
    children: ReactNode
    className?: string
}

export function CardHeader({ children, className }: CardHeaderProps) {
    return (
        <div className={cn('mb-6', className)}>
            {children}
        </div>
    )
}

/**
 * CardTitle Component
 */
interface CardTitleProps {
    children: ReactNode
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export function CardTitle({ children, size = 'md', className }: CardTitleProps) {
    const sizeClasses = {
        sm: 'text-lg font-serif',
        md: 'text-2xl font-serif',
        lg: 'text-3xl font-serif',
    }

    return (
        <h3 className={cn(sizeClasses[size], 'text-foreground', className)}>
            {children}
        </h3>
    )
}

/**
 * CardDescription Component
 */
interface CardDescriptionProps {
    children: ReactNode
    className?: string
}

export function CardDescription({ children, className }: CardDescriptionProps) {
    return (
        <p className={cn('text-muted-foreground text-sm font-light mt-1', className)}>
            {children}
        </p>
    )
}

/**
 * CardContent Component
 */
interface CardContentProps {
    children: ReactNode
    className?: string
}

export function CardContent({ children, className }: CardContentProps) {
    return (
        <div className={cn(className)}>
            {children}
        </div>
    )
}
