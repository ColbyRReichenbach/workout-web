"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NanoParticles } from '@/components/NanoParticles';
import { LoginView } from '@/components/views/LoginView';
import { OnboardingView } from '@/components/views/OnboardingView';
import { DashboardView } from '@/components/views/DashboardView';
import { Heart } from 'lucide-react';

type ViewState = 'LOGIN' | 'ONBOARDING' | 'DASHBOARD';

export const PulseCoordinator = () => {
    const [view, setView] = useState<ViewState>('LOGIN');
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [triggerPulse, setTriggerPulse] = useState(false);

    // Easing from Apple guidelines
    const transition = { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const };

    const handleLoginSuccess = () => {
        setView('ONBOARDING');
    };

    const handleOnboardingComplete = () => {
        setIsTransitioning(true);
        // Stage 1: Card collapses to heart (handled by exit animation of OnboardingView and layoutId)

        // After card collapse delay, trigger pulse
        setTimeout(() => {
            setTriggerPulse(true); // Triggers particle explosion
        }, 600);
    };

    const handlePulseComplete = () => {
        // Pulse explosion done, reveal dashboard
        setView('DASHBOARD');
        setIsTransitioning(false);
        setTriggerPulse(false);
    };

    return (
        <div className="relative min-h-screen w-full bg-[#f5f2ed] overflow-hidden">
            {/* Global Styles for Animations */}
            <style>{`
                @keyframes heartbeat-pulse {
                    0% { transform: scale(1); filter: drop-shadow(0 0 20px rgba(239,68,68,0.2)); }
                    15% { transform: scale(1.15); filter: drop-shadow(0 0 40px rgba(239,68,68,0.4)); }
                    30% { transform: scale(1); }
                    45% { transform: scale(1.2); filter: drop-shadow(0 0 50px rgba(239,68,68,0.5)); }
                    70% { transform: scale(1); }
                }
            `}</style>

            {/* Background Atmosphere */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-5%] left-[-5%] w-[50%] h-[50%] bg-red-200/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-5%] right-[-5%] w-[60%] h-[60%] bg-[#ef4444]/10 blur-[140px] rounded-full" />
            </div>

            {/* Persistent Particle Layer */}
            <NanoParticles
                intensity={isTransitioning ? 2 : 1}
                heartDuration={isTransitioning ? "0.6s" : "1.8s"}
                oneShot={triggerPulse}
                triggerPulse={triggerPulse}
                onPulseComplete={handlePulseComplete}
            />

            <AnimatePresence mode="wait">
                {view === 'LOGIN' && (
                    <motion.div
                        key="login"
                        className="fixed inset-0 z-10"
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.5 } }}
                    >
                        <LoginView onLoginSuccess={handleLoginSuccess} />
                    </motion.div>
                )}

                {view === 'ONBOARDING' && (
                    <motion.div
                        key="onboarding"
                        className="fixed inset-0 z-10 flex items-center justify-center"
                    >
                        {/* 
                             The OnboardingView contains the layoutId="card". 
                             When this component unmounts (onComplete), we want the card to morph into the heart.
                         */}
                        <OnboardingView onComplete={handleOnboardingComplete} />
                    </motion.div>
                )}

                {view === 'ONBOARDING' && isTransitioning && (
                    // This block handles the "Collapse to Heart" visual state during the exit of Onboarding
                    <motion.div
                        key="transition-heart"
                        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* 
                            This is the target state for layoutId="heart-icon" 
                            The Onboarding View has an opaque/hidden heart.
                            When Onboarding unmounts, we show this one.
                         */}
                        <motion.div
                            layoutId="heart-container"
                            className="relative"
                        >
                            <motion.div
                                layoutId="heart-icon"
                                animate={{
                                    scale: triggerPulse ? 30 : 1,
                                    opacity: triggerPulse ? 0 : 1
                                }}
                                transition={{
                                    duration: 0.8,
                                    ease: [0.16, 1, 0.3, 1]
                                }}
                            >
                                <Heart className="w-64 h-64 text-[#ef4444] fill-[#ef4444] animate-[heartbeat-pulse_0.6s_ease-in-out_infinite]" />
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}

                {view === 'DASHBOARD' && (
                    <motion.div
                        key="dashboard"
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={transition}
                        className="fixed inset-0 z-10 bg-[#f5f2ed]"
                    >
                        <DashboardView />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
