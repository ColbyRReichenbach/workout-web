import { describe, it, expect } from 'vitest';
import {
    calculate5kDerivedPaces,
    calculate2kRowDerivedPaces,
    calculate400mPaceFromMile,
    formatPace,
    parseWorkoutTemplate
} from '../../src/lib/calculations/paceZones';
import { UserProfile } from '../../src/lib/types';

describe('paceZones Calculations', () => {
    describe('calculate5kDerivedPaces', () => {
        it('should calculate correct Zone 2 and Tempo paces from 5k time', () => {
            // 5k in 24:00 (1440s). Pace is 1440 / 3.10686 = 463.49 s/mile
            // Zone 2 = 463.49 + 67.5 = 530.99 (531)
            // Tempo = 463.49 + 25 = 488.49 (488)
            const paces = calculate5kDerivedPaces(1440);
            expect(paces.zone2PacePerMile).toBe(531);
            expect(paces.tempoPacePerMile).toBe(488);
        });
    });

    describe('calculate2kRowDerivedPaces', () => {
        it('should calculate correct rowing paces from 2k time', () => {
            // 2k in 8:00 (480s). Split is 120s
            // Aerobic = 120 + 9 = 129
            // Anaerobic = (120 - 15) / 2 = 52.5 (53)
            const paces = calculate2kRowDerivedPaces(480);
            expect(paces.aerobicInterval500m).toBe(129);
            expect(paces.anaerobicSprint250m).toBe(53);
        });
    });

    describe('calculate400mPaceFromMile', () => {
        it('should calculate correct 400m target from mile time', () => {
            // Mile in 8:00 (480s)
            // 400m target = (480 / 4) - 10 = 110s
            expect(calculate400mPaceFromMile(480)).toBe(110);
        });
    });

    describe('formatPace', () => {
        it('should format seconds into MM:SS correctly', () => {
            expect(formatPace(125)).toBe('2:05');
            expect(formatPace(65)).toBe('1:05');
            expect(formatPace(488)).toBe('8:08');
        });
    });

    describe('parseWorkoutTemplate', () => {
        const mockProfile: UserProfile = {
            id: 'test-user',
            row_2k_sec: 480, // 8:00 (129 aerobic split)
            k5_time_sec: 1440, // 24:00 (8:51 zone 2)
            mile_time_sec: 480, // 8:00 (1:50 400m)
            max_hr: 200,
        } as any;

        it('should replace rowing mustache variables', () => {
            const template = 'Row 5x500m @ {{row_interval_pace_500m}}';
            const parsed = parseWorkoutTemplate(template, mockProfile);
            expect(parsed).toBe('Row 5x500m @ 2:09/500m');
        });

        it('should replace run mustache variables', () => {
            const template = 'Run Zone 2 @ {{run_zone2_pace_mile}}';
            const parsed = parseWorkoutTemplate(template, mockProfile);
            expect(parsed).toBe('Run Zone 2 @ 8:51/mile');
        });

        it('should replace HR mustache variables', () => {
            const template = 'Keep HR in {{zone_2_hr}}';
            const parsed = parseWorkoutTemplate(template, mockProfile);
            // 200 * 0.73 = 146, 200 * 0.82 = 164
            expect(parsed).toBe('Keep HR in 146-164 bpm');
        });

        it('should handle missing variables by returning original match', () => {
            const template = 'Unknown {{unknown_var}}';
            const parsed = parseWorkoutTemplate(template, mockProfile);
            expect(parsed).toBe('Unknown {{unknown_var}}');
        });

        it('should return original text if profile is missing', () => {
            const template = 'Row @ {{row_interval_pace_500m}}';
            expect(parseWorkoutTemplate(template, null)).toBe(template);
        });
    });
});
