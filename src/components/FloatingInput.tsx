
import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    className?: string;
}

export const FloatingInput = ({ label, className = "", value, onChange, ...props }: FloatingInputProps) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value !== "" && value !== undefined;

    return (
        <div className={`relative ${className}`}>
            <motion.label
                initial={false}
                animate={{
                    top: isFocused || hasValue ? "0.5rem" : "1.25rem",
                    fontSize: isFocused || hasValue ? "0.65rem" : "1rem",
                    color: isFocused ? "var(--primary)" : "var(--muted-foreground)"
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute left-4 pointer-events-none font-bold uppercase tracking-widest z-10"
            >
                {label}
            </motion.label>
            <input
                {...props}
                value={value}
                onChange={onChange}
                onFocus={(e) => {
                    setIsFocused(true);
                    props.onFocus?.(e);
                }}
                onBlur={(e) => {
                    setIsFocused(false);
                    props.onBlur?.(e);
                }}
                className="w-full pt-8 pb-3 px-4 rounded-2xl glass-pro border border-border text-lg font-serif outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/50 text-foreground transition-all placeholder-transparent bg-transparent"
            />
        </div>
    );
};
