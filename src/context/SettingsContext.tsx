"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { normalizeUnit, UnitSystem } from '@/lib/conversions';
import { updateSetting } from '@/lib/userSettings';
import { useRouter } from 'next/navigation';

interface SettingsState {
    units: UnitSystem;
    theme: string;
}

interface SettingsContextType extends SettingsState {
    setUnits: (unit: UnitSystem) => Promise<void>;
    setTheme: (theme: string) => Promise<void>;
    isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({
    children,
    initialSettings
}: {
    children: React.ReactNode;
    initialSettings: { units: string | null; theme: string | null }
}) {
    const router = useRouter();
    const [units, setUnitsState] = useState<UnitSystem>(normalizeUnit(initialSettings.units));
    const [theme, setThemeState] = useState<string>(initialSettings.theme || 'Pulse Light');
    const [isLoading, setIsLoading] = useState(false);

    // Apply theme to document element
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'Dark Mode' || theme === 'Pulse Dark' || theme.toLowerCase().includes('dark')) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme]);

    const setUnits = async (newUnit: UnitSystem) => {
        setUnitsState(newUnit);
        setIsLoading(true);
        try {
            await updateSetting('units', newUnit);
            router.refresh();
        } catch (error) {
            console.error("Failed to update unit:", error);
            // Revert on error? Or just log.
        } finally {
            setIsLoading(false);
        }
    };

    const setTheme = async (newTheme: string) => {
        setThemeState(newTheme);
        setIsLoading(true);
        try {
            await updateSetting('theme', newTheme);
            router.refresh();
        } catch (error) {
            console.error("Failed to update theme:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SettingsContext.Provider value={{ units, theme, setUnits, setTheme, isLoading }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
