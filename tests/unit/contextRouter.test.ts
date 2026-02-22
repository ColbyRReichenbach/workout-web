import { describe, it, expect } from 'vitest';
import { buildDynamicContext, detectIntent, Message, formatSegmentsForAI } from '../../src/lib/ai/contextRouter';
import { UserProfile, WorkoutSegment } from '../../src/lib/types';

describe('detectIntent (Stateful)', () => {
    it('should detect INJURY intent from direct keywords', () => {
        const messages: Message[] = [
            { role: 'user', content: 'My shoulder hurts during overhead press.' }
        ];
        expect(detectIntent(messages)).toBe('INJURY');
    });

    it('should detect LOGISTICS intent for daily routine queries', () => {
        const messages: Message[] = [
            { role: 'user', content: "What is my workout today?" }
        ];
        expect(detectIntent(messages)).toBe('LOGISTICS');
    });

    it('should carry over INJURY intent for follow-up questions', () => {
        const messages: Message[] = [
            { role: 'user', content: 'I have a sharp pain in my knee.' },
            { role: 'assistant', content: 'I am sorry to hear that. You should stop training...' },
            { role: 'user', content: 'What else can I do?' } // Follow-up
        ];
        expect(detectIntent(messages)).toBe('INJURY');
    });

    it('should carry over PROGRESS intent for analytics follow-ups', () => {
        const messages: Message[] = [
            { role: 'user', content: 'Show me my progress for the last month.' },
            { role: 'assistant', content: 'Here are your stats...' },
            { role: 'user', content: 'Why?' } // Short follow-up
        ];
        expect(detectIntent(messages)).toBe('PROGRESS');
    });

    it('should detect new intent even in follow-up if keywords are present', () => {
        const messages: Message[] = [
            { role: 'user', content: 'My back is sore.' },
            { role: 'assistant', content: 'Rest is advised.' },
            { role: 'user', content: 'Actually, just show me my workout.' } // Explicit change
        ];
        expect(detectIntent(messages)).toBe('LOGISTICS');
    });

    it('should default to GENERAL for unrelated queries', () => {
        const messages: Message[] = [
            { role: 'user', content: 'Hello ECHO-P1!' }
        ];
        expect(detectIntent(messages)).toBe('GENERAL');
    });
});



describe('buildDynamicContext', () => {
    it('uses phase-local week when currentWeek is absolute', async () => {
        const supabase = {
            from: () => ({
                select: () => ({
                    single: async () => ({
                        data: {
                            program_data: {
                                phases: [
                                    {
                                        id: 1,
                                        weeks: Array.from({ length: 8 }, () => ({ days: [{ day: 'Monday', title: 'P1', segments: [{ name: 'P1 Segment' }] }] })),
                                    },
                                    {
                                        id: 2,
                                        weeks: [
                                            { days: [{ day: 'Monday', title: 'P2 Week 1', segments: [{ name: 'Phase2 Week1 Segment' }] }] },
                                            { days: [{ day: 'Monday', title: 'P2 Week 2', segments: [{ name: 'Phase2 Week2 Segment' }] }] },
                                        ],
                                    },
                                ],
                            },
                        },
                    }),
                }),
            }),
        };

        const context = await buildDynamicContext('LOGISTICS', 2, 9, [{ role: 'user', content: 'What is my workout today?' }], 'Monday', undefined, supabase);

        expect(context.systemPromptAdditions).toContain('P2 Week 1');
        expect(context.systemPromptAdditions).toContain('Phase2 Week1 Segment');
    });
});
describe('formatSegmentsForAI', () => {
    const mockProfile: UserProfile = {
        row_2k_sec: 480, // 8:00
        max_hr: 200,
        bench_max: 200,
    } as any;

    it('should format strength segments with calculated weights', () => {
        const segments: WorkoutSegment[] = [
            {
                name: 'Bench Press',
                type: 'MAIN_LIFT',
                tracking_mode: 'STRENGTH_SETS',
                target: {
                    sets: 3,
                    reps: 5,
                    percent_1rm: 0.80
                }
            }
        ];
        const formatted = formatSegmentsForAI(segments, mockProfile);
        expect(formatted).toContain('1. Bench Press (MAIN_LIFT)');
        expect(formatted).toContain('[3x5, @ 80% 1RM, -> 160 lbs]');
    });

    it('should parse cardio templates in details and notes', () => {
        const segments: WorkoutSegment[] = [
            {
                name: 'Rowing Intervals',
                type: 'CARDIO',
                tracking_mode: 'CARDIO_BASIC',
                details: '5 x 500m @ {{row_interval_pace_500m}}',
                notes: 'Keep HR in {{zone_2_hr}}',
                target: {
                    duration_min: 25
                }
            }
        ];
        const formatted = formatSegmentsForAI(segments, mockProfile);
        expect(formatted).toContain('Details: 5 x 500m @ 2:09/500m');
        expect(formatted).toContain('Note: Keep HR in 146-164 bpm');
    });

    it('should handle missing profiles gracefully', () => {
        const segments: WorkoutSegment[] = [
            {
                name: 'Row',
                type: 'CARDIO',
                tracking_mode: 'CARDIO_BASIC',
                details: '{{row_interval_pace_500m}}'
            }
        ];
        const formatted = formatSegmentsForAI(segments, undefined);
        expect(formatted).toContain('Details: {{row_interval_pace_500m}}');
    });
});
