"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Activity,
    Home,
    Settings,
    User,
    BarChart2,
    Menu,
    X,
    HeartPulse
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navigation = [
    { name: "Feed", href: "/", icon: Home },
    { name: "Live", href: "/workout", icon: Activity },
    { name: "Stats", href: "/analytics", icon: BarChart2 },
    { name: "Gear", href: "/settings", icon: Settings },
];

export function Navbar() {
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const isProfileActive = pathname === "/profile";
    const isPublicRoute = pathname === "/login" || pathname === "/onboarding";

    if (isPublicRoute) return null;

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-[150] transition-all duration-300 px-4 py-4 md:px-8",
                scrolled ? "py-2" : "py-6"
            )}
        >
            <div className={cn(
                "max-w-7xl mx-auto rounded-3xl border transition-all duration-300 flex items-center justify-between px-6 py-3 relative z-10",
                scrolled
                    ? "bg-white/70 backdrop-blur-xl border-black/5 shadow-xl shadow-black/5"
                    : "bg-white/40 backdrop-blur-md border-transparent shadow-none"
            )}>
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group relative z-20">
                    <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                        <HeartPulse size={24} />
                    </div>
                    <span className="font-serif text-2xl font-bold tracking-tight text-foreground">
                        Pulse
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-1 relative z-20">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "relative px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-2",
                                    isActive
                                        ? "text-primary"
                                        : "text-muted-foreground hover:text-foreground hover:bg-black/5"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-pill"
                                        className="absolute inset-0 bg-primary/10 rounded-xl"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <item.icon size={16} />
                                <span className="relative z-10">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Profile Avatar (Mini) */}
                <div className="flex items-center gap-3 border-l border-black/5 pl-4 md:pl-6 ml-1 md:ml-2 relative z-20">
                    <Link href="/profile" className={cn(
                        "w-8 h-8 md:w-10 md:h-10 rounded-full border-2 transition-all flex items-center justify-center hover:scale-110 active:scale-90 group relative z-30",
                        isProfileActive
                            ? "border-primary bg-primary text-white shadow-lg shadow-primary/20"
                            : "border-white bg-stone-100 text-stone-400 hover:bg-stone-200 hover:text-stone-600"
                    )}>
                        <User size={isProfileActive ? 18 : 16} strokeWidth={2.5} className="relative z-10 transition-transform group-hover:scale-110" />
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="md:hidden p-2 ml-1 rounded-xl bg-black/5 hover:bg-black/10 transition-all relative z-20"
                >
                    {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="md:hidden mt-4 bg-white/90 backdrop-blur-2xl border border-black/5 rounded-3xl p-4 shadow-2xl overflow-hidden"
                    >
                        <div className="grid grid-cols-2 gap-2">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-4 text-sm font-medium rounded-2xl transition-all",
                                            isActive
                                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                : "text-muted-foreground bg-black/5 hover:bg-black/10"
                                        )}
                                    >
                                        <item.icon size={18} />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
