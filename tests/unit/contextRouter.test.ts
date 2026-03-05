import { describe, it, expect } from 'vitest';
import { buildDynamicContext, detectIntent, Message, formatSegmentsForAI } from '../../src/lib/ai/contextRouter';
import { UserProfile, WorkoutSegment } from '../../src/lib/types';

// ============================================
// detectIntent
// ============================================

describe('detectIntent (Stateful)', () => {
    it('detects INJURY from direct keywords', () => {
        const messages: Message[] = [
            { role: 'user', content: 'My shoulder hurts during overhead press.' }
        ];
        expect(detectIntent(messages)).toBe('INJURY');
    });

    it('detects LOGISTICS for daily routine queries', () => {
        const messages: Message[] = [
            { role: 'user', content: 'What is my workout today?' }
        ];
        expect(detectIntent(messages)).toBe('LOGISTICS');
    });

    it('detects PROGRESS for data/stats queries', () => {
        const messages: Message[] = [
            { role: 'user', content: 'Show me my squat progress over the last month.' }
        ];
        expect(detectIntent(messages)).toBe('PROGRESS');
    });

    it('defaults to GENERAL for unrelated queries', () => {
        const messages: Message[] = [
            { role: 'user', content: 'Hello ECHO-P1!' }
        ];
        expect(detectIntent(messages)).toBe('GENERAL');
    });

    it('carries over INJURY intent for short follow-ups', () => {
        const messages: Message[] = [
            { role: 'user', content: 'I have a sharp pain in my knee.' },
            { role: 'assistant', content: 'I am sorry to hear that. You should stop training.' },
            { role: 'user', content: 'What else can I do?' }
        ];
        expect(detectIntent(messages)).toBe('INJURY');
    });

    it('carries over PROGRESS intent for analytics follow-ups', () => {
        const messages: Message[] = [
            { role: 'user', content: 'Show me my progress for the last month.' },
            { role: 'assistant', content: 'Here are your stats...' },
            { role: 'user', content: 'Why?' }
        ];
        expect(detectIntent(messages)).toBe('PROGRESS');
    });

    it('overrides carried intent if new explicit keywords found', () => {
        const messages: Message[] = [
            { role: 'user', content: 'My back is sore.' },
            { role: 'assistant', content: 'Rest is advised.' },
            { role: 'user', content: 'Actually, just show me my workout.' }
        ];
        expect(detectIntent(messages)).toBe('LOGISTICS');
    });
});

// ============================================
// buildDynamicContext — phase-local week mapping
// ============================================

function makeMockSupabase(phases: any[]) {
    return {
        from: () => ({
            select: () => ({
                single: async () => ({
                    data: { program_data: { phases } },
                }),
            }),
        }),
    };
}

describe('buildDynamicContext — dynamic phase derivation', () => {
    const twoPhaseProgram = [
        {
            id: 1,
            weeks: Array.from({ length: 8 }, (_, i) => ({
                days: [{ day: 'Monday', title: `P1 Week ${i + 1}`, segments: [{ name: `P1W${i + 1} Segment` }] }]
            })),
        },
        {
            id: 2,
            weeks: [
                { days: [{ day: 'Monday', title: 'P2 Week 1', segments: [{ name: 'Phase2 Week1 Segment' }] }] },
                { days: [{ day: 'Monday', title: 'P2 Week 2', segments: [{ name: 'Phase2 Week2 Segment' }] }] },
            ],
        },
    ];

    it('resolves week 9 to Phase 2, week 1 content', async () => {
        const supabase = makeMockSupabase(twoPhaseProgram);
        // currentPhase=1 is stale; week 9 is in Phase 2 → dynamic derivation should override
        const context = await buildDynamicContext('LOGISTICS', 2, 9, [{ role: 'user', content: 'What is my workout today?' }], 'Monday', undefined, supabase);
        expect(context.systemPromptAdditions).toContain('P2 Week 1');
        expect(context.systemPromptAdditions).toContain('Phase2 Week1 Segment');
    });

    it('resolves week 1 to Phase 1 content', async () => {
        const supabase = makeMockSupabase(twoPhaseProgram);
        const context = await buildDynamicContext('LOGISTICS', 1, 1, [{ role: 'user', content: 'What is my workout today?' }], 'Monday', undefined, supabase);
        expect(context.systemPromptAdditions).toContain('P1 Week 1');
        expect(context.systemPromptAdditions).toContain('P1W1 Segment');
    });

    it('resolves week 8 still in Phase 1', async () => {
        const supabase = makeMockSupabase(twoPhaseProgram);
        const context = await buildDynamicContext('LOGISTICS', 1, 8, [{ role: 'user', content: 'workout' }], 'Monday', undefined, supabase);
        expect(context.systemPromptAdditions).toContain('P1 Week 8');
    });

    it('clamps to last phase when week exceeds program length', async () => {
        const supabase = makeMockSupabase(twoPhaseProgram);
        // week 100 is way beyond all phases — should clamp to last phase
        const context = await buildDynamicContext('LOGISTICS', 1, 100, [{ role: 'user', content: 'workout' }], 'Monday', undefined, supabase);
        // Should not throw and should reference Phase 2 content
        expect(context.systemPromptAdditions).toBeTruthy();
    });

    it('stale DB phase (currentPhase=1) is overridden for absolute week 9', async () => {
        const supabase = makeMockSupabase(twoPhaseProgram);
        // passing currentPhase=1 (stale DB value) but week=9 — dynamic derivation must win
        const context = await buildDynamicContext('LOGISTICS', 1, 9, [{ role: 'user', content: 'What is my workout today?' }], 'Monday', undefined, supabase);
        // Should get Phase 2 content, NOT Phase 1
        expect(context.systemPromptAdditions).not.toContain('P1W1 Segment');
        expect(context.systemPromptAdditions).toContain('Phase2 Week1 Segment');
    });
});

// ============================================
// formatSegmentsForAI
// ============================================

describe('formatSegmentsForAI', () => {
    const mockProfile: UserProfile = {
        row_2k_sec: 480, // 8:00
        max_hr: 200,
        bench_max: 200,
    } as any;

    it('formats strength segments with calculated weights', () => {
        const segments: WorkoutSegment[] = [
            {
                name: 'Bench Press',
                type: 'MAIN_LIFT',
                tracking_mode: 'STRENGTH_SETS',
                target: { sets: 3, reps: 5, percent_1rm: 0.80 }
            }
        ];
        const formatted = formatSegmentsForAI(segments, mockProfile);
        expect(formatted).toContain('1. Bench Press (MAIN_LIFT)');
        expect(formatted).toContain('[3x5, @ 80% 1RM, -> 160 lbs]');
    });

    it('parses cardio templates in details and notes', () => {
        const segments: WorkoutSegment[] = [
            {
                name: 'Rowing Intervals',
                type: 'CARDIO',
                tracking_mode: 'CARDIO_BASIC',
                details: '5 x 500m @ {{row_interval_pace_500m}}',
                notes: 'Keep HR in {{zone_2_hr}}',
                target: { duration_min: 25 }
            }
        ];
        const formatted = formatSegmentsForAI(segments, mockProfile);
        expect(formatted).toContain('Details: 5 x 500m @ 2:09/500m');
        expect(formatted).toContain('Note: Keep HR in 146-164 bpm');
    });

    it('handles missing profile gracefully (leaves templates unparsed)', () => {
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
