"use client";

import React from 'react';
import { motion } from 'framer-motion';

export const DashboardView = () => {
    return (
        <div className="w-full h-full p-6">
            <h1 className="text-4xl font-serif mb-6">Dashboard Preview</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-64 bg-white/40 rounded-3xl border border-zinc-200"></div>
                <div className="h-64 bg-white/40 rounded-3xl border border-zinc-200"></div>
                <div className="h-64 bg-white/40 rounded-3xl border border-zinc-200"></div>
            </div>
        </div>
    );
}
