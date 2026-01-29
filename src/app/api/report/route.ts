import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { DEMO_USER_ID } from '@/lib/constants';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages, timestamp } = body;

        // Auth check (optional but recommended)
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Use user ID or falling back to demo/guest ID for reference
        const userId = user?.id || DEMO_USER_ID;

        // Send to Sentry
        const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

        // Ensure Sentry is initialized even if global config fails
        if (!Sentry.isInitialized() && dsn) {
            Sentry.init({
                dsn,
                tracesSampleRate: 0.1,
                environment: 'development'
            });
        }

        // Helper to extract content safely (handles AI SDK parts)
        const getMessageContent = (message: any): string => {
            if (typeof message.content === 'string' && message.content.length > 0) return message.content;
            if (message.parts && Array.isArray(message.parts)) {
                const textParts = message.parts
                    .filter((part: any) => part.type === 'text' && typeof part.text === 'string')
                    .map((part: any) => part.text);
                if (textParts.length > 0) return textParts.join('\n');
            }
            return '';
        };

        const readableConversation = messages.map((m: any) => ({
            role: m.role,
            text: getMessageContent(m)
        }));

        const conversationSummary = readableConversation
            .map((m: any) => `[${m.role.toUpperCase()}]: ${m.text}`)
            .join('\n\n---\n\n');

        Sentry.withScope((scope) => {
            scope.setUser({ id: userId });
            scope.setExtra('conversation_summary', conversationSummary);
            scope.setExtra('conversation_raw', messages);
            scope.setTag('type', 'user_report');
            scope.setTag('user_id', userId);
            scope.setTag('environment', 'development');

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
