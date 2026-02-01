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

        // Check auth & admin status
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || DEMO_USER_ID;

        // Fetch is_admin status
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', userId)
            .single();

        if (!profile?.is_admin) {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get('days') || '7');

        // Calculate date range
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get feedback stats (GLOBAL for admins)
        const feedbackPromise = supabase
            .from('ai_feedback')
            .select('rating, intent, tools_used, latency_ms, created_at, user_message, ai_response')
            .gte('created_at', startDate.toISOString());

        // Get engineering logs (GLOBAL for admins)
        const logsPromise = supabase
            .from('ai_logs')
            .select('*')
            .gte('created_at', startDate.toISOString());

        const [feedbackRes, logsRes] = await Promise.all([feedbackPromise, logsPromise]);

        if (feedbackRes.error) console.error('[AI Analytics] Feedback error:', feedbackRes.error);
        if (logsRes.error) console.error('[AI Analytics] Logs error:', logsRes.error);

        const feedback = feedbackRes.data || [];
        const logs = logsRes.data || [];

        // Calculate feedback metrics
        const totalFeedback = feedback.length;
        const positiveCount = feedback.filter(f => f.rating === 'positive').length;
        const negativeCount = feedback.filter(f => f.rating === 'negative').length;
        const satisfactionRate = totalFeedback > 0
            ? Math.round((positiveCount / totalFeedback) * 100)
            : null;

        // Engineering metrics from logs
        const totalTokens = logs.reduce((sum, l) => sum + (l.total_tokens || 0), 0);
        const totalCost = logs.reduce((sum, l) => sum + Number(l.estimated_cost_usd || 0), 0);
        const avgLatency = logs.length > 0
            ? Math.round(logs.reduce((sum, l) => sum + (l.latency_ms || 0), 0) / logs.length)
            : null;

        const modelDistribution = logs.reduce((acc, l) => {
            const m = l.model_id || 'unknown';
            acc[m] = (acc[m] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Calculate per-user stats
        const userStats: Record<string, { requests: number; tokens: number; cost: number }> = {};
        for (const l of logs) {
            const uid = l.user_id || 'anonymous';
            if (!userStats[uid]) {
                userStats[uid] = { requests: 0, tokens: 0, cost: 0 };
            }
            userStats[uid].requests++;
            userStats[uid].tokens += (l.total_tokens || 0);
            userStats[uid].cost += Number(l.estimated_cost_usd || 0);
        }

        const topUsers = Object.entries(userStats)
            .map(([userId, stats]) => ({
                userId,
                requests: stats.requests,
                totalTokens: stats.tokens,
                totalCostUsd: Number(stats.cost.toFixed(4))
            }))
            .sort((a, b) => b.requests - a.requests)
            .slice(0, 10);

        // Intent breakdown (from feedback primarily, or logs if we want broader data)
        const intentCounts: Record<string, { positive: number; negative: number; total: number }> = {};
        for (const f of feedback) {
            const intent = f.intent || 'UNKNOWN';
            if (!intentCounts[intent]) {
                intentCounts[intent] = { positive: 0, negative: 0, total: 0 };
            }
            intentCounts[intent][f.rating as 'positive' | 'negative']++;
            intentCounts[intent].total++;
        }

        // Add intents from logs that might not have feedback yet
        for (const l of logs) {
            const intent = l.intent || 'UNKNOWN';
            if (!intentCounts[intent]) {
                intentCounts[intent] = { positive: 0, negative: 0, total: 0 };
            }
            // We don't have ratings in logs, so we just track volume
        }

        // Tool usage breakdown (from logs for better coverage)
        const toolCounts: Record<string, number> = {};
        for (const l of logs) {
            for (const tool of l.tools_used || []) {
                toolCounts[tool] = (toolCounts[tool] || 0) + 1;
            }
        }

        // Get in-memory query analytics
        const queryAnalytics = getAnalyticsSummary();
        const typoPatterns = getTypoPatterns();

        // Recent negative feedback (for review)
        const recentNegative = feedback
            .filter(f => f.rating === 'negative')
            .slice(0, 10)
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
            engineering: {
                totalLogs: logs.length,
                totalTokens,
                totalCostUsd: Number(totalCost.toFixed(4)),
                avgLatencyMs: avgLatency,
                modelDistribution,
                topUsers
            },
            intents: Object.entries(intentCounts)
                .map(([intent, counts]) => ({
                    intent,
                    positive: counts.positive,
                    negative: counts.negative,
                    total: counts.total,
                    successRate: counts.total > 0 ? Math.round((counts.positive / counts.total) * 100) : 0
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
