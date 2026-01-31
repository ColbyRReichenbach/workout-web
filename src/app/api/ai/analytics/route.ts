import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getAnalyticsSummary, getTypoPatterns } from '@/lib/ai/queryAnalytics';
import { DEMO_USER_ID } from '@/lib/constants';

/**
 * GET /api/ai/analytics
 * Get AI coach analytics and observability data
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check auth
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || DEMO_USER_ID;

        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get('days') || '7');

        // Calculate date range
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get feedback stats
        const { data: feedbackData, error: feedbackError } = await supabase
            .from('ai_feedback')
            .select('rating, intent, tools_used, latency_ms, created_at, user_message, ai_response')
            .eq('user_id', userId)
            .gte('created_at', startDate.toISOString());

        if (feedbackError) {
            console.error('[AI Analytics] Feedback error:', feedbackError);
        }

        const feedback = feedbackData || [];

        // Calculate feedback metrics
        const totalFeedback = feedback.length;
        const positiveCount = feedback.filter(f => f.rating === 'positive').length;
        const negativeCount = feedback.filter(f => f.rating === 'negative').length;
        const satisfactionRate = totalFeedback > 0
            ? Math.round((positiveCount / totalFeedback) * 100)
            : null;

        // Average latency
        const latencies = feedback
            .map(f => f.latency_ms)
            .filter((l): l is number => l !== null);
        const avgLatency = latencies.length > 0
            ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
            : null;

        // Intent breakdown
        const intentCounts: Record<string, { positive: number; negative: number }> = {};
        for (const f of feedback) {
            const intent = f.intent || 'UNKNOWN';
            if (!intentCounts[intent]) {
                intentCounts[intent] = { positive: 0, negative: 0 };
            }
            intentCounts[intent][f.rating as 'positive' | 'negative']++;
        }

        // Tool usage breakdown
        const toolCounts: Record<string, number> = {};
        for (const f of feedback) {
            for (const tool of f.tools_used || []) {
                toolCounts[tool] = (toolCounts[tool] || 0) + 1;
            }
        }

        // Get in-memory query analytics (if any)
        const queryAnalytics = getAnalyticsSummary();
        const typoPatterns = getTypoPatterns();

        // Recent negative feedback (for review)
        const recentNegative = feedback
            .filter(f => f.rating === 'negative')
            .slice(0, 5)
            .map(f => ({
                intent: f.intent,
                tools: f.tools_used,
                latency: f.latency_ms,
                date: f.created_at,
                user_message: f.user_message,
                ai_response: f.ai_response
            }));

        return NextResponse.json({
            period: {
                days,
                start: startDate.toISOString(),
                end: new Date().toISOString()
            },
            feedback: {
                total: totalFeedback,
                positive: positiveCount,
                negative: negativeCount,
                satisfactionRate,
                recentNegative
            },
            performance: {
                avgLatencyMs: avgLatency,
                latencyCount: latencies.length
            },
            intents: Object.entries(intentCounts)
                .map(([intent, counts]) => ({
                    intent,
                    positive: counts.positive,
                    negative: counts.negative,
                    total: counts.positive + counts.negative,
                    successRate: Math.round((counts.positive / (counts.positive + counts.negative)) * 100)
                }))
                .sort((a, b) => b.total - a.total),
            tools: Object.entries(toolCounts)
                .map(([tool, count]) => ({ tool, count }))
                .sort((a, b) => b.count - a.count),
            queryAnalytics: {
                totalQueries: queryAnalytics.totalQueries,
                topExercises: queryAnalytics.topExercises,
                correctionRate: queryAnalytics.correctionRate,
                typoPatterns: typoPatterns.slice(0, 10)
            }
        });

    } catch (error) {
        console.error('[AI Analytics] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
