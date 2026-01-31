/**
 * Segment Lookup Module - Database-Backed Exercise Normalization
 * 
 * Uses the segment_info table with GIN indexes for fast O(1) alias/typo lookups.
 * Falls back to in-memory normalization if database unavailable.
 */

import { createClient } from '@/utils/supabase/server';
import { normalizeExercise, NormalizationResult } from './exerciseNormalization';

// ============================================
// TYPES
// ============================================

export interface SegmentInfo {
    id: string;
    segment_name: string;
    canonical_name: string;
    segment_type: string;
    tracking_mode: string | null;
    aliases: string[];
    typos: string[];
    phase_ids: number[];
    pr_field: string | null;
    is_cardio: boolean;
    created_at: string;
    updated_at: string;
}

export interface SegmentLookupResult {
    found: boolean;
    segment: SegmentInfo | null;
    matchType: 'alias' | 'typo' | 'canonical' | 'fuzzy' | 'none';
    query: string;
    correctedFrom?: string;
}

// ============================================
// LOOKUP FUNCTIONS
// ============================================

/**
 * Look up segment info by alias or typo (database-backed)
 * Uses GIN indexes for fast array searches - O(1) lookups
 * 
 * @param query - User input to search for (e.g., "squirt", "z2 run", "dl")
 * @returns SegmentLookupResult with segment info if found
 */
export async function lookupSegment(query: string): Promise<SegmentLookupResult> {
    const lower = query.toLowerCase().trim();

    if (!lower) {
        return {
            found: false,
            segment: null,
            matchType: 'none',
            query
        };
    }

    try {
        const supabase = await createClient();

        // Step 1: Exact alias match (O(1) with GIN index)
        const { data: aliasMatch, error: aliasError } = await supabase
            .from('segment_info')
            .select('*')
            .contains('aliases', [lower])
            .limit(1)
            .single();

        if (aliasMatch && !aliasError) {
            return {
                found: true,
                segment: aliasMatch as SegmentInfo,
                matchType: 'alias',
                query
            };
        }

        // Step 2: Typo match (O(1) with GIN index)
        const { data: typoMatch, error: typoError } = await supabase
            .from('segment_info')
            .select('*')
            .contains('typos', [lower])
            .limit(1)
            .single();

        if (typoMatch && !typoError) {
            return {
                found: true,
                segment: typoMatch as SegmentInfo,
                matchType: 'typo',
                query,
                correctedFrom: lower
            };
        }

        // Step 3: Canonical name match
        const { data: canonicalMatch, error: canonicalError } = await supabase
            .from('segment_info')
            .select('*')
            .eq('canonical_name', lower)
            .limit(1)
            .single();

        if (canonicalMatch && !canonicalError) {
            return {
                found: true,
                segment: canonicalMatch as SegmentInfo,
                matchType: 'canonical',
                query
            };
        }

        // Step 4: Fallback to in-memory fuzzy matching
        const normalized = normalizeExercise(query);
        if (normalized.confidence >= 0.6) {
            // Try to find by normalized canonical name
            const { data: fuzzyMatch, error: fuzzyError } = await supabase
                .from('segment_info')
                .select('*')
                .eq('canonical_name', normalized.normalized)
                .limit(1)
                .single();

            if (fuzzyMatch && !fuzzyError) {
                return {
                    found: true,
                    segment: fuzzyMatch as SegmentInfo,
                    matchType: 'fuzzy',
                    query,
                    correctedFrom: normalized.wasCorrected ? query : undefined
                };
            }
        }

        // No match found
        return {
            found: false,
            segment: null,
            matchType: 'none',
            query
        };

    } catch (error) {
        console.error('[SegmentLookup] Database error, falling back to in-memory:', error);

        // Fallback: Use in-memory normalization only
        const normalized = normalizeExercise(query);
        return {
            found: normalized.confidence >= 0.6,
            segment: null,
            matchType: normalized.confidence >= 0.6 ? 'fuzzy' : 'none',
            query,
            correctedFrom: normalized.wasCorrected ? query : undefined
        };
    }
}

/**
 * Get segment info with PR field for a given exercise
 * Useful for determining which PR field to query in profiles table
 */
export async function getSegmentPRField(exercise: string): Promise<string | null> {
    const result = await lookupSegment(exercise);
    return result.found && result.segment ? result.segment.pr_field : null;
}

/**
 * Check if an exercise is cardio (determines trend direction interpretation)
 */
export async function isCardioExercise(exercise: string): Promise<boolean> {
    const result = await lookupSegment(exercise);
    return result.found && result.segment ? result.segment.is_cardio : false;
}

/**
 * Get all segments for a given canonical name
 * Useful for finding all variations of an exercise
 */
export async function getSegmentsByCanonical(canonicalName: string): Promise<SegmentInfo[]> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('segment_info')
            .select('*')
            .eq('canonical_name', canonicalName)
            .order('segment_name');

        if (error) throw error;
        return data as SegmentInfo[];
    } catch (error) {
        console.error('[SegmentLookup] Error fetching by canonical:', error);
        return [];
    }
}

/**
 * Search segments by partial match on name or aliases
 * Useful for autocomplete/suggestions
 */
export async function searchSegments(query: string, limit: number = 10): Promise<SegmentInfo[]> {
    const lower = query.toLowerCase().trim();
    if (!lower) return [];

    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('segment_info')
            .select('*')
            .or(`segment_name.ilike.%${lower}%,canonical_name.ilike.%${lower}%`)
            .limit(limit);

        if (error) throw error;
        return data as SegmentInfo[];
    } catch (error) {
        console.error('[SegmentLookup] Error searching segments:', error);
        return [];
    }
}

// ============================================
// ADMIN/SYNC FUNCTIONS
// ============================================

/**
 * Get segments that exist in logs but not in segment_info
 * Useful for identifying new exercises that need to be added
 */
export async function getMissingSegments(): Promise<Array<{ segment_name: string; segment_type: string; count: number }>> {
    try {
        const supabase = await createClient();

        // Get unique segments from logs
        const { data: logSegments, error: logError } = await supabase
            .from('logs')
            .select('segment_name, segment_type')
            .not('segment_name', 'is', null);

        if (logError) throw logError;

        // Get existing segments from segment_info
        const { data: existingSegments, error: existingError } = await supabase
            .from('segment_info')
            .select('segment_name');

        if (existingError) throw existingError;

        const existingNames = new Set(existingSegments?.map(s => s.segment_name) || []);

        // Count missing segments
        const missingCounts: Record<string, { type: string; count: number }> = {};
        for (const log of logSegments || []) {
            if (log.segment_name && !existingNames.has(log.segment_name)) {
                if (!missingCounts[log.segment_name]) {
                    missingCounts[log.segment_name] = { type: log.segment_type || 'UNKNOWN', count: 0 };
                }
                missingCounts[log.segment_name].count++;
            }
        }

        // Return sorted by count
        return Object.entries(missingCounts)
            .map(([name, { type, count }]) => ({ segment_name: name, segment_type: type, count }))
            .sort((a, b) => b.count - a.count);

    } catch (error) {
        console.error('[SegmentLookup] Error getting missing segments:', error);
        return [];
    }
}

/**
 * Add a new typo mapping to an existing segment
 * Useful for learning from query analytics
 */
export async function addTypoMapping(segmentName: string, typo: string): Promise<boolean> {
    try {
        const supabase = await createClient();
        const lower = typo.toLowerCase().trim();

        // First get the current typos array
        const { data: segment, error: fetchError } = await supabase
            .from('segment_info')
            .select('typos')
            .eq('segment_name', segmentName)
            .single();

        if (fetchError || !segment) return false;

        // Add new typo if not already present
        if (!segment.typos.includes(lower)) {
            const { error: updateError } = await supabase
                .from('segment_info')
                .update({
                    typos: [...segment.typos, lower],
                    updated_at: new Date().toISOString()
                })
                .eq('segment_name', segmentName);

            if (updateError) throw updateError;
        }

        return true;
    } catch (error) {
        console.error('[SegmentLookup] Error adding typo mapping:', error);
        return false;
    }
}

/**
 * Get segment statistics
 */
export async function getSegmentStats(): Promise<{
    totalSegments: number;
    totalAliases: number;
    totalTypos: number;
    uniqueCanonicals: number;
}> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('segment_info')
            .select('canonical_name, aliases, typos');

        if (error) throw error;

        const segments = data || [];
        const canonicalSet = new Set(segments.map(s => s.canonical_name));

        return {
            totalSegments: segments.length,
            totalAliases: segments.reduce((sum, s) => sum + (s.aliases?.length || 0), 0),
            totalTypos: segments.reduce((sum, s) => sum + (s.typos?.length || 0), 0),
            uniqueCanonicals: canonicalSet.size
        };
    } catch (error) {
        console.error('[SegmentLookup] Error getting stats:', error);
        return { totalSegments: 0, totalAliases: 0, totalTypos: 0, uniqueCanonicals: 0 };
    }
}
