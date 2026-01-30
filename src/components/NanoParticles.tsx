"use client";

import React, { useEffect, useRef, useState } from 'react';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    opacity: number;
    size: number;
    color: string;
}

interface NanoParticlesProps {
    intensity?: number;
    heartDuration?: string;
    triggerPulse?: boolean;
    onPulseComplete?: () => void;
    oneShot?: boolean;
}

export const NanoParticles = ({
    intensity = 1,
    heartDuration = '1.8s',
    triggerPulse,
    onPulseComplete,
    oneShot = false
}: NanoParticlesProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<Particle[]>([]);
    const requestRef = useRef<number>(0);
    const lastBeatTime = useRef<number>(0);
    const secondBeatFired = useRef<boolean>(false);
    const smoothIntensity = useRef(0);
    const pulseTriggered = useRef(false);
    const [reducedMotion, setReducedMotion] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setReducedMotion(mediaQuery.matches);
        const handleMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
        mediaQuery.addEventListener('change', handleMotionChange);

        const handleVisibilityChange = () => {
            setIsVisible(document.visibilityState === 'visible');
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            mediaQuery.removeEventListener('change', handleMotionChange);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (!isVisible || reducedMotion) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.current = [];
            return;
        }

        const dpr = window.devicePixelRatio || 1;
        const handleResize = () => {
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            ctx.scale(dpr, dpr);
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        const parseDuration = (dur: string) => {
            const val = parseFloat(dur);
            return isNaN(val) ? 1800 : val * 1000;
        };

        const createBurstParticles = (count: number, currentInt: number) => {
            const newParticles: Particle[] = [];
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                // Start around the heart's inner core (behind its surface)
                const dist = oneShot ? (30 + Math.random() * 40) : (40 + Math.random() * 40);
                const minSpeed = oneShot ? 10.0 : 3.0;
                const maxSpeed = oneShot ? 55.0 : 10.0;
                const speed = minSpeed + (maxSpeed - minSpeed) * Math.min(currentInt / 2, 1);

                newParticles.push({
                    x: window.innerWidth / 2 + Math.cos(angle) * dist,
                    y: window.innerHeight / 2 + Math.sin(angle) * dist,
                    vx: Math.cos(angle) * speed * (0.5 + Math.random() * 1.0),
                    vy: Math.sin(angle) * speed * (0.5 + Math.random() * 1.0),
                    life: 1,
                    opacity: 0.95 + Math.random() * 0.05,
                    size: oneShot ? (1.5 + Math.random() * 4.5) : (2.0 + Math.random() * 3.5),
                    color: Math.random() > 0.4 ? '#ef4444' : '#ffffff'
                });
            }
            return newParticles;
        };

        const animate = (time: number) => {
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

            smoothIntensity.current += (intensity - smoothIntensity.current) * 0.08;
            const cur = smoothIntensity.current;

            if (oneShot) {
                if (triggerPulse && !pulseTriggered.current) {
                    pulseTriggered.current = true;
                    // Massive cinematic burst
                    particles.current.push(...createBurstParticles(Math.floor(700 + intensity * 200), intensity));
                    setTimeout(() => {
                        onPulseComplete?.();
                    }, 1400); // Allow time for particles to shoot out past screen edges
                }
            } else {
                const beatInterval = parseDuration(heartDuration);
                const timeSinceLastBeat = time - lastBeatTime.current;

                if (timeSinceLastBeat >= beatInterval) {
                    lastBeatTime.current = time;
                    secondBeatFired.current = false;
                    const burstCount = Math.floor(20 + cur * 45);
                    particles.current.push(...createBurstParticles(burstCount, cur));
                } else if (!secondBeatFired.current && timeSinceLastBeat >= beatInterval * 0.30) {
                    secondBeatFired.current = true;
                    const burstCount = Math.floor(12 + cur * 30);
                    particles.current.push(...createBurstParticles(burstCount, cur));
                }
            }

            const MAX_PARTICLES = 2000;
            if (particles.current.length > MAX_PARTICLES) {
                particles.current = particles.current.slice(-MAX_PARTICLES);
            }

            // High momentum physics for one-shot
            const friction = 0.995;
            const lifeDecay = oneShot ? 0.003 : (0.003 + (cur * 0.002));

            for (let i = particles.current.length - 1; i >= 0; i--) {
                const p = particles.current[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= friction;
                p.vy *= friction;
                p.life -= lifeDecay;

                if (p.life <= 0) {
                    particles.current.splice(i, 1);
                    continue;
                }

                ctx.globalAlpha = p.life * p.opacity;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * (0.4 + p.life * 0.6), 0, Math.PI * 2);
                ctx.fill();
            }

            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(requestRef.current);
        };
    }, [intensity, heartDuration, isVisible, reducedMotion, oneShot, triggerPulse, onPulseComplete]);

    if (reducedMotion) return null;

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none z-10 w-full h-full"
            style={{ opacity: 0.9 }}
        />
    );
};
