/**
 * Checkpoint Test Alert Component
 * Shows when user is in a checkpoint testing week
 */

"use client";

import { AlertCircle, Trophy, Calendar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { CheckpointWeek } from "@/lib/checkpointTests";

interface CheckpointTestAlertProps {
    checkpointData: CheckpointWeek;
    onStartTesting?: () => void;
}

export function CheckpointTestAlert({ checkpointData, onStartTesting }: CheckpointTestAlertProps) {
    const strengthTests = checkpointData.tests.filter(t => t.type === 'strength');
    const cardioTests = checkpointData.tests.filter(t => t.type === 'cardio');

    return (
        <Card variant="elevated" className="border-2 border-primary bg-primary/5">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle size="lg">🎯 Checkpoint Testing Week {checkpointData.week}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Time to establish new baselines
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                    <p className="text-sm leading-relaxed">
                        {checkpointData.globalInstructions}
                    </p>
                </div>

                {checkpointData.schedule && (
                    <div className="space-y-3">
                        <h4 className="font-serif text-lg font-bold flex items-center gap-2">
                            <Calendar size={18} />
                            Testing Schedule
                        </h4>
                        <div className="grid gap-2">
                            {Object.entries(checkpointData.schedule).map(([day, tests]) => (
                                <div key={day} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                    <div className="font-bold text-xs uppercase tracking-widest text-primary min-w-[80px]">
                                        {day}
                                    </div>
                                    <div className="flex-1 text-sm">
                                        {tests.join(', ')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                    {strengthTests.length > 0 && (
                        <div>
                            <h4 className="font-serif font-bold mb-2">💪 Strength Tests</h4>
                            <ul className="space-y-1 text-sm">
                                {strengthTests.map(test => (
                                    <li key={test.name} className="flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        <span>{test.name}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {cardioTests.length > 0 && (
                        <div>
                            <h4 className="font-serif font-bold mb-2">🏃 Cardio Tests</h4>
                            <ul className="space-y-1 text-sm">
                                {cardioTests.map(test => (
                                    <li key={test.name} className="flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        <span>{test.name}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground/80">
                        <strong>Why test?</strong> These benchmarks recalculate your training zones and percentages for the next phase, ensuring your programming stays aligned with your actual progress.
                    </p>
                </div>

                {onStartTesting && (
                    <button
                        onClick={onStartTesting}
                        className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors"
                    >
                        View Testing Protocol →
                    </button>
                )}
            </CardContent>
        </Card>
    );
}
