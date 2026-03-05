import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { DEMO_USER_ID, RATE_LIMITS } from '@/lib/constants';
import * as Sentry from '@sentry/nextjs';
import { checkRateLimit } from '@/lib/redis';
import { getClientIp } from '@/lib/ip';

export async function POST(req: Request) {
    try {
        // Rate limit to prevent flooding Sentry with reports
        const ip = await getClientIp();
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const identifier = user?.id ?? ip;
        const rateLimit = await checkRateLimit(identifier, RATE_LIMITS.AUTH, '@upstash/ratelimit/report');
        if (!rateLimit.allowed) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        const body = await req.json();
        const { messages, timestamp } = body;

        // Validate messages is an array (basic guard)
        if (!Array.isArray(messages)) {
            return NextResponse.json({ error: 'Invalid request: messages must be an array' }, { status: 400 });
        }

        // Hard limit: never process more than 50 messages to prevent large payload abuse
        const MAX_REPORT_MESSAGES = 50;
        // Per-message content cap to prevent individual oversized entries
        const MAX_MSG_CONTENT_LENGTH = 1000;

        const limitedMessages = messages.slice(0, MAX_REPORT_MESSAGES);

        // Use user ID or falling back to demo/guest ID for reference
        const userId = user?.id || DEMO_USER_ID;

        // Helper to extract content safely (handles AI SDK parts), with hard length cap
        const getMessageContent = (message: any): string => {
            let text = '';
            if (typeof message.content === 'string' && message.content.length > 0) {
                text = message.content;
            } else if (message.parts && Array.isArray(message.parts)) {
                const textParts = message.parts
                    .filter((part: any) => part.type === 'text' && typeof part.text === 'string')
                    .map((part: any) => part.text);
                if (textParts.length > 0) text = textParts.join('\n');
            }
            // Cap individual message content length
            return text.slice(0, MAX_MSG_CONTENT_LENGTH);
        };

        const readableConversation = limitedMessages.map((m: any) => ({
            role: typeof m.role === 'string' ? m.role.slice(0, 20) : 'unknown',
            text: getMessageContent(m)
        }));

        const conversationSummary = readableConversation
            .map((m: any) => `[${m.role.toUpperCase()}]: ${m.text}`)
            .join('\n\n---\n\n');

        Sentry.withScope((scope) => {
            scope.setUser({ id: userId });
            // Only log the truncated, sanitized summary — never the raw messages array,
            // which could contain unbounded user content or PII
            scope.setExtra('conversation_summary', conversationSummary);
            scope.setExtra('message_count', limitedMessages.length);
            scope.setTag('type', 'user_report');
            scope.setTag('user_id', userId);
            scope.setTag('environment', process.env.NODE_ENV || 'development');

            const reportError = new Error(`User Conversation Report (${userId})`);
            reportError.name = 'UserReport';

            Sentry.captureException(reportError);
        });

        // Force flush to ensure event is sent before serverless function exits
        await Sentry.flush(2000);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API/Report] Error processing report:', error);
        Sentry.captureException(error);
        await Sentry.flush(2000);
        return NextResponse.json(
            { error: 'Failed to process report' },
            { status: 500 }
        );
    }
}
