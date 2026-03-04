import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { DEMO_USER_ID, RATE_LIMITS } from '@/lib/constants';
import { checkRateLimit } from '@/lib/redis';
import { getClientIp } from '@/lib/ip';

/**
 * POST /api/ai/feedback
 * Submit user feedback on AI response
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check auth
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || DEMO_USER_ID;

        // Rate limit feedback submissions
        const ip = await getClientIp();
        const identifier = user?.id ?? ip;
        const rateLimit = await checkRateLimit(identifier, RATE_LIMITS.AUTH, '@upstash/ratelimit/feedback');
        if (!rateLimit.allowed) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        const body = await request.json();
        const {
            messageId,
            rating,
            userMessage,
            aiResponse,
            intent,
            toolsUsed,
            latencyMs
        } = body;

        // Validate required fields
        if (!messageId || !rating) {
            return NextResponse.json(
                { error: 'messageId and rating are required' },
                { status: 400 }
            );
        }

        if (!['positive', 'negative'].includes(rating)) {
            return NextResponse.json(
                { error: 'rating must be "positive" or "negative"' },
                { status: 400 }
            );
        }

        // Truncate messages to reduce storage and PII exposure
        const truncate = (str: string | undefined, maxLen: number = 500) =>
            str ? str.substring(0, maxLen) : null;

        // Insert feedback
        const { error } = await supabase
            .from('ai_feedback')
            .insert({
                user_id: userId,
                message_id: messageId,
                rating,
                user_message: truncate(userMessage),
                ai_response: truncate(aiResponse),
                intent: intent || null,
                tools_used: toolsUsed || [],
                latency_ms: latencyMs || null,
            });

        if (error) {
            console.error('[AI Feedback] Insert error:', error);
            return NextResponse.json(
                { error: 'Failed to save feedback' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[AI Feedback] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/ai/feedback
 * Get user's own feedback history
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check auth
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || DEMO_USER_ID;

        const { searchParams } = new URL(request.url);
        const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10) || 20, 1), 100);

        const { data, error } = await supabase
            .from('ai_feedback')
            .select('id, message_id, rating, intent, tools_used, latency_ms, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[AI Feedback] Select error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch feedback' },
                { status: 500 }
            );
        }

        return NextResponse.json({ feedback: data });

    } catch (error) {
        console.error('[AI Feedback] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
