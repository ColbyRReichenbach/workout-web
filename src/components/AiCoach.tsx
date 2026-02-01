"use client";

import { useChat, type UIMessage } from '@ai-sdk/react';
import { Send, Bot, HeartPulse, AlertCircle, Flag, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { DEMO_USER_ID } from '@/lib/constants';
import ReportModal from './ReportModal';

interface AIProfile {
    ai_name: string | null;
    ai_personality: string | null;
}

// Helper type for text parts
interface TextPart {
    type: 'text';
    text: string;
}

export default function AiCoach() {
    const [localError, setLocalError] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'positive' | 'negative' | null>>({});
    const [messageStartTimes, setMessageStartTimes] = useState<Record<string, number>>({});
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const {
        messages,
        sendMessage,
        status,
        error: chatError,
    } = useChat({
        api: '/api/chat',
        body: {
            userDay: new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase(),
            intentTag: activeTag
        },
        onError: (err: Error) => {
            console.error('[AiCoach] Error:', err);
            setLocalError(err.message || 'An error occurred. Please try again.');
        },
        onFinish: ({ message }: { message: any }) => {
            console.log('[AiCoach] Message finished:', message.id);

            // Transfer pending start time to this message ID for latency tracking
            setMessageStartTimes(prev => {
                const startTime = prev['_pending'];
                if (startTime) {
                    const { _pending, ...rest } = prev;
                    return { ...rest, [message.id]: startTime };
                }
                return prev;
            });

            setLocalError(null);
            // Reset tag after use
            setActiveTag(null);
        },
    } as any);

    const [profile, setProfile] = useState<AIProfile | null>(null);

    const isLoading = status === 'streaming' || status === 'submitted';

    // Auto-scroll to bottom only when new messages arrive (not on initial load if empty)
    const prevMessagesLength = useRef(0);
    useEffect(() => {
        if (messages.length > prevMessagesLength.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        prevMessagesLength.current = messages.length;
    }, [messages]);

    // Fetch user's AI profile settings
    useEffect(() => {
        async function fetchProfile() {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                const userId = user?.id || DEMO_USER_ID;

                const { data } = await supabase
                    .from('profiles')
                    .select('ai_name, ai_personality')
                    .eq('id', userId)
                    .single();

                setProfile(data);
            } catch (err) {
                console.error('[AiCoach] Failed to fetch profile:', err);
            }
        }
        fetchProfile();
    }, []);

    // Handle form submission
    const onSubmit = async (e?: React.FormEvent<HTMLFormElement>, text?: string, tag?: string) => {
        if (e) e.preventDefault();

        const messageText = text || inputValue;
        if (!messageText.trim() || isLoading) return;

        console.log('[AiCoach] Submitting message:', messageText.substring(0, 50));
        setLocalError(null);

        if (!text) setInputValue('');

        // If tag is provided, set it before sending. 
        // Note: With sendMessage, we might need a small delay or use a ref if state doesn't update fast enough,
        // but let's try setting it and calling sendMessage.
        if (tag) {
            setActiveTag(tag);
        }

        try {
            // Track start time for latency calculation
            const startTime = Date.now();
            await (sendMessage as any)({ text: messageText });
            // Store start time keyed by next message (will be set in onFinish)
            setMessageStartTimes(prev => ({ ...prev, _pending: startTime }));
        } catch (err) {
            console.error('[AiCoach] Send failed:', err);
            setLocalError('Failed to send message. Please try again.');
        }
    };

    // Submit feedback for a message
    const submitFeedback = useCallback(async (
        messageId: string,
        rating: 'positive' | 'negative',
        userMessage?: string,
        aiResponse?: string,
        rawMessage?: any
    ) => {
        // Mark as given immediately for UI
        setFeedbackGiven(prev => ({ ...prev, [messageId]: rating }));

        try {
            // Extract intent and tools from message if provided
            const toolsUsed = rawMessage?.toolInvocations?.map((ti: any) => ti.toolName) || [];

            const response = await fetch('/api/ai/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messageId,
                    rating,
                    userMessage: userMessage?.substring(0, 500),
                    aiResponse: aiResponse?.substring(0, 1000),
                    latencyMs: messageStartTimes[messageId] ? Date.now() - messageStartTimes[messageId] : null,
                    toolsUsed,
                    // Note: intent could be passed here if we had it in the message object
                })
            });

            if (!response.ok) {
                console.error('[AiCoach] Feedback submission failed');
            }
        } catch (err) {
            console.error('[AiCoach] Feedback error:', err);
        }
    }, []);

    // Comprehensive formatter for all known tool response types
    const formatToolResult = (result: unknown): string => {
        // Handle string that might be JSON
        if (typeof result === 'string') {
            const trimmed = result.trim();
            // Try to parse if it looks like JSON
            if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
                (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                try {
                    const parsed = JSON.parse(trimmed);
                    return formatToolResult(parsed); // Recursively format parsed JSON
                } catch {
                    return result; // Return original if not valid JSON
                }
            }
            return result;
        }

        if (!result || typeof result !== 'object') return String(result);

        // Handle arrays (like multiple PR results)
        if (Array.isArray(result)) {
            if (result.length === 0) return 'No data found.';

            // Check if it's an array of PR-like objects
            if (result[0]?.exercise && result[0]?.formatted) {
                return result.map(item =>
                    `• ${item.exercise}: ${item.formatted}`
                ).join('\n');
            }

            // Check if it's an array of log entries
            if (result[0]?.date || result[0]?.segment) {
                return result.slice(0, 5).map(log => {
                    const date = log.date || 'Unknown date';
                    const segment = log.segment || log.type || 'Activity';
                    const daysAgo = log.days_ago !== undefined ? ` (${log.days_ago} days ago)` : '';
                    return `• ${date}${daysAgo}: ${segment}`;
                }).join('\n') + (result.length > 5 ? `\n... and ${result.length - 5} more` : '');
            }

            // Generic array handling
            return result.slice(0, 5).map((item, i) =>
                typeof item === 'object' ? formatToolResult(item) : `• ${item}`
            ).join('\n');
        }

        const obj = result as Record<string, any>;

        // Handle PR/Exercise result: { exercise, pr, formatted, type }
        if (obj.exercise !== undefined && (obj.pr !== undefined || obj.formatted !== undefined)) {
            const exerciseName = obj.exercise.charAt(0).toUpperCase() + obj.exercise.slice(1);
            return `Your ${exerciseName} PR is ${obj.formatted || obj.pr}.`;
        }

        // Handle findLastLog result: { filter, count, logs: [...] }
        if (obj.filter !== undefined && obj.logs !== undefined) {
            const logCount = obj.count || obj.logs.length;
            if (logCount === 0 || !obj.logs.length) {
                return `No ${obj.filter} logs found in your history.`;
            }
            const lastLog = obj.logs[0];
            const date = lastLog.date || 'Unknown date';
            const daysAgo = lastLog.days_ago !== undefined ? ` (${lastLog.days_ago} days ago)` : '';
            const segment = lastLog.segment || lastLog.type || '';
            let response = `Your last ${obj.filter} was on ${date}${daysAgo}.`;
            if (segment) response += ` Activity: ${segment}.`;
            if (lastLog.data) {
                const data = lastLog.data;
                if (data.distance) response += ` Distance: ${data.distance} miles.`;
                if (data.duration_min) response += ` Duration: ${data.duration_min} min.`;
                if (data.avg_hr) response += ` Avg HR: ${data.avg_hr} bpm.`;
            }
            return response;
        }

        // Handle getRecentLogs result: { period, count, logs: [...] }
        if (obj.period !== undefined && obj.logs !== undefined) {
            const logCount = obj.count || obj.logs.length;
            if (logCount === 0) {
                return `No logs found for ${obj.period}.`;
            }
            let response = `Found ${logCount} logs for ${obj.period}.`;
            if (obj.logs.length > 0) {
                const types = [...new Set(obj.logs.map((l: any) => l.type || l.segment))].slice(0, 3);
                if (types.length) response += ` Types: ${types.join(', ')}.`;
            }
            return response;
        }

        // Handle getBiometrics result: { period, count, summary, data }
        if (obj.period !== undefined && obj.data !== undefined && obj.summary) {
            return `${obj.period}: ${obj.summary}`;
        }

        // Handle getComplianceReport result: { period, summary: { workout_days, compliance_percent, ... } }
        if (obj.summary !== undefined && obj.summary.compliance_percent !== undefined) {
            const s = obj.summary;
            let response = `${obj.period || 'Recent'} Workout Compliance:\n`;
            response += `• ${s.workout_days}/${s.expected_days} workout days (${s.compliance_percent}%)\n`;
            response += `• ${s.total_segments || 0} total segments logged`;
            if (s.avg_rpe) response += `, Avg RPE: ${s.avg_rpe}`;
            return response;
        }


        // Handle getRecoveryMetrics output: { period, data_sources, averages, latest }
        if (obj.averages !== undefined && obj.latest !== undefined) {
            const avgs = obj.averages;
            const latest = obj.latest;
            const period = obj.period || 'Recent';

            let response = `${period} Recovery Summary:\n`;

            // Latest data (most relevant for "how did I sleep last night?")
            if (latest.sleep_hrs !== null && latest.sleep_hrs !== undefined) {
                response += `• Last night: ${latest.sleep_hrs} hours of sleep`;
                if (latest.hrv) response += `, HRV ${latest.hrv}ms`;
                if (latest.readiness) response += `, Readiness ${latest.readiness}`;
                response += `\n`;
            }

            // Averages
            if (avgs.sleep_hrs !== null && avgs.sleep_hrs !== undefined) {
                response += `• Average sleep: ${avgs.sleep_hrs}h`;
            }
            if (avgs.hrv_ms !== null && avgs.hrv_ms !== undefined) {
                response += `, HRV: ${avgs.hrv_ms}ms`;
            }
            if (avgs.resting_hr !== null && avgs.resting_hr !== undefined) {
                response += `, RHR: ${avgs.resting_hr}bpm`;
            }
            if (avgs.readiness !== null && avgs.readiness !== undefined) {
                response += `, Readiness: ${avgs.readiness}`;
            }

            return response.trim();
        }

        // Handle recovery metrics: { recovery_score, hrv, sleep_quality }
        if (obj.recovery_score !== undefined || obj.hrv !== undefined) {
            let response = 'Recovery Metrics:';
            if (obj.recovery_score !== undefined) response += ` Score: ${obj.recovery_score}.`;
            if (obj.hrv !== undefined) response += ` HRV: ${obj.hrv}.`;
            if (obj.sleep_quality !== undefined) response += ` Sleep: ${obj.sleep_quality}.`;
            return response;
        }

        // Handle biometrics: { weight, body_fat, etc }
        if (obj.weight !== undefined || obj.body_fat !== undefined) {
            let response = 'Current Biometrics:';
            if (obj.weight !== undefined) response += ` Weight: ${obj.weight} lbs.`;
            if (obj.body_fat !== undefined) response += ` Body Fat: ${obj.body_fat}%.`;
            return response;
        }

        // Handle trend analysis: { trend, summary }
        if (obj.trend !== undefined || obj.analysis !== undefined) {
            return obj.summary || obj.analysis || `Trend: ${obj.trend}`;
        }

        // Handle error responses
        if (obj.error) {
            return `Unable to retrieve data: ${obj.error}`;
        }

        // Handle generic summary/message
        const summary = obj.summary || obj.message;
        if (summary) return summary;

        // Last resort: format key-value pairs nicely (avoid raw JSON)
        const entries = Object.entries(obj).filter(([k]) => !['originalQuery', 'wasCorrected', 'normalizedFilter'].includes(k));
        if (entries.length > 0 && entries.length <= 6) {
            return entries
                .map(([k, v]) => {
                    const key = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                    const val = typeof v === 'object' ? (Array.isArray(v) ? `${v.length} items` : '(details)') : v;
                    return `${key}: ${val}`;
                })
                .join('\n');
        }

        return 'Data retrieved successfully.';
    };

    // Detect and sanitize raw JSON in AI text responses
    const sanitizeJsonText = (text: string): string => {
        const trimmed = text.trim();

        // Check if the entire response looks like JSON
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
            (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            try {
                const parsed = JSON.parse(trimmed);
                return formatToolResult(parsed);
            } catch {
                // Not valid JSON, return as-is
            }
        }

        // Check for multiple JSON objects (common pattern when multiple tool results)
        const jsonPattern = /\{[\s\S]*?\}(?=\s*\{|\s*$)/g;
        const matches = trimmed.match(jsonPattern);
        if (matches && matches.length > 1) {
            try {
                const results = matches.map(m => JSON.parse(m));
                return results.map(r => formatToolResult(r)).join('\n\n');
            } catch {
                // Not all valid JSON, return as-is
            }
        }

        return text;
    };


    // Extract displayable content from message
    const getMessageContent = (message: UIMessage): string => {
        const m = message as any;

        // 1. Tool-role messages (SDK v6 fallback)
        if (m.role === 'tool') {
            return formatToolResult(m.result !== undefined ? m.result : '');
        }

        // 2. Check parts array (SDK v6+)
        if (m.parts && Array.isArray(m.parts)) {
            const displayParts = m.parts
                .map((part: any) => {
                    // Text parts - sanitize any raw JSON
                    if (part.type === 'text' && typeof part.text === 'string') {
                        return sanitizeJsonText(part.text);
                    }

                    // Tool parts (tool-name or dynamic-tool)
                    if (part.type.startsWith('tool-') || part.type === 'dynamic-tool') {
                        if (part.state === 'output-available' && part.output !== undefined) {
                            const toolName = part.toolName || part.type.replace('tool-', '');
                            // We skip the [Result: ...] header to keep it clean, or keep it if helpful
                            // The prompt asked for "readable summaries", so let's format the output nicely
                            return formatToolResult(part.output);
                        }

                        // Show "Analyzing..." or similar for pending tools
                        if (part.state === 'input-available' || part.state === 'input-streaming') {
                            return `_Analyzing ${part.toolName || part.type.replace('tool-', '')}..._`;
                        }

                        return '';
                    }

                    // Legacy tool-result type
                    if (part.type === 'tool-result') {
                        return formatToolResult(part.result !== undefined ? part.result : '');
                    }

                    return '';
                })
                .filter(Boolean);

            if (displayParts.length > 0) {
                return displayParts.join('\n\n');
            }
        }

        // 3. Fallback to standard content property
        if (typeof m.content === 'string' && m.content.trim()) return sanitizeJsonText(m.content);

        // 4. Client-side fallback if assistant text is empty but tool results exist
        if (m.role === 'assistant') {
            const invocations = m.toolInvocations || [];
            if (invocations.length > 0) {
                const lastResultInvocation = [...invocations].reverse().find((i: any) => i.state === 'result');
                if (lastResultInvocation) {
                    const summary = formatToolResult(lastResultInvocation.result);
                    return `I retrieved your data, but could not format a full response. Here is a summary:\n\n${summary}`;
                }
            }
        }

        return '';
    };

    // Filter out messages that genuinely have no content
    const displayableMessages = messages.filter(message => {
        const m = message as any;
        if (m.role === 'user') return true;
        if (m.role === 'tool') return true;

        const content = getMessageContent(message);

        // Show assistant messages if they have any content (text or tool results)
        if (m.role === 'assistant' && content) return true;

        // Also show if it has active/pending tools to provide feedback that logic is working
        const toolParts = m.parts?.filter((p: any) => p.type.startsWith('tool-') || p.type === 'dynamic-tool') || [];
        if (m.role === 'assistant' && toolParts.length > 0) return true;

        return content.length > 0;
    });

    const lastAssistantMessage = [...displayableMessages].reverse().find(m => m.role === 'assistant');

    /**
     * Action Chips Component
     */
    const ActionChips = () => {
        const suggestions = useMemo(() => {
            if (!lastAssistantMessage) {
                return [
                    { label: "What's my workout today?", tag: "logistics" },
                    { label: "How is my progress?", tag: "progress" }
                ];
            }

            const content = getMessageContent(lastAssistantMessage).toLowerCase();

            if (content.includes('injury') || content.includes('pain') || content.includes('hurt') || content.includes('regression')) {
                return [
                    { label: "Regression", tag: "injury" },
                    { label: "Substitution", tag: "injury" },
                    { label: "Rest Tips", tag: "injury" }
                ];
            }

            if (content.includes('workout') || content.includes('routine') || content.includes('exercise')) {
                return [
                    { label: "Substitution", tag: "logistics" },
                    { label: "Target Weight", tag: "progress" },
                    { label: "Log Session", tag: "logistics" }
                ];
            }

            return [
                { label: "Explain more", tag: "general" },
                { label: "Tomorrow's Plan", tag: "logistics" }
            ];
        }, [lastAssistantMessage]);

        if (isLoading && displayableMessages.length > 0) return null;

        return (
            <div className="flex flex-wrap gap-1.5 mb-3 px-1">
                {suggestions.map((s, i) => (
                    <motion.button
                        key={i}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSubmit(undefined, s.label, s.tag)}
                        className="px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all shadow-sm"
                    >
                        {s.label}
                    </motion.button>
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full p-4 relative">
            <ReportModal
                isOpen={isReportOpen}
                onClose={() => setIsReportOpen(false)}
                messages={messages}
            />

            {/* Header / Teaser */}
            <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20 transition-all duration-300 hover:scale-105 hover:shadow-primary/30">
                        <Bot size={24} className="text-primary-foreground" />
                    </div>
                    <div>
                        <h3 className="text-xl font-serif text-foreground font-medium tracking-tight">
                            {profile?.ai_name || "ECHO-P1"}
                        </h3>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
                            {profile?.ai_personality ? `${profile.ai_personality}` : "Protocol Analyst"}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setIsReportOpen(true)}
                    className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-all duration-200"
                    title="Report an issue"
                >
                    <Flag size={16} />
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 rounded-[32px] overflow-y-auto flex flex-col gap-5 mb-6 scrollbar-hide px-2">
                <AnimatePresence mode="popLayout">
                    {displayableMessages.length === 0 && !isLoading && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="flex-1 flex flex-col items-center justify-center px-6 text-center"
                        >
                            <p className="text-muted-foreground text-sm font-light italic leading-relaxed max-w-[200px] mb-8">
                                &quot;Protocol analysis standby. Ready to optimize your trajectory.&quot;
                            </p>
                            <div className="w-full">
                                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mb-4 opacity-50">Try Asking</p>
                                <ActionChips />
                            </div>
                        </motion.div>
                    )}

                    {displayableMessages.map((m, idx) => {
                        // Find the user message before this assistant message (for context)
                        const prevUserMessage = m.role === 'assistant'
                            ? displayableMessages.slice(0, idx).reverse().find(msg => msg.role === 'user')
                            : null;
                        const userMsgContent = prevUserMessage ? getMessageContent(prevUserMessage) : undefined;
                        const aiMsgContent = getMessageContent(m);

                        return (
                            <motion.div
                                key={m.id}
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                            >
                                <div className={`max-w-[95%] rounded-[24px] px-5 py-3.5 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${m.role === 'user'
                                    ? 'bg-foreground text-background rounded-br-none'
                                    : 'bg-muted/30 text-foreground rounded-bl-none border border-border/50 backdrop-blur-sm'
                                    }`}>
                                    {aiMsgContent}
                                </div>

                                {/* Feedback buttons for assistant messages */}
                                {m.role === 'assistant' && aiMsgContent && (
                                    <div className="flex items-center gap-1 mt-1.5 ml-2">
                                        {!feedbackGiven[m.id] ? (
                                            <>
                                                <button
                                                    onClick={() => submitFeedback(m.id, 'positive', userMsgContent, aiMsgContent, m)}
                                                    className="p-1.5 rounded-full text-muted-foreground/50 hover:text-green-500 hover:bg-green-500/10 transition-all"
                                                    title="Helpful response"
                                                >
                                                    <ThumbsUp size={12} />
                                                </button>
                                                <button
                                                    onClick={() => submitFeedback(m.id, 'negative', userMsgContent, aiMsgContent, m)}
                                                    className="p-1.5 rounded-full text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                                    title="Not helpful"
                                                >
                                                    <ThumbsDown size={12} />
                                                </button>
                                            </>
                                        ) : (
                                            <span className="text-[10px] text-muted-foreground/60 italic">
                                                Thanks for the feedback!
                                            </span>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}

                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-start"
                        >
                            <div className="bg-muted/50 text-muted-foreground rounded-full px-5 py-2 text-[9px] uppercase font-bold tracking-[0.2em] animate-pulse border border-border/50">
                                {messages[messages.length - 1]?.parts?.some((p: any) => p.type.startsWith('tool-') && (p.state === 'input-available' || p.state === 'input-streaming'))
                                    ? `Analyzing (${(messages[messages.length - 1].parts as any[]).find(p => p.type.startsWith('tool-') && (p.state === 'input-available' || p.state === 'input-streaming'))?.toolName || 'Protocol'})`
                                    : 'Analyzing'}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Error Display */}
                {(localError || chatError) && (
                    <div className="flex justify-center">
                        <div className="bg-destructive/10 text-destructive rounded-2xl px-6 py-3 text-sm flex items-center gap-2 border border-destructive/20">
                            <AlertCircle size={16} />
                            <span>{localError || chatError?.message || 'An error occurred'}</span>
                        </div>
                    </div>
                )}

                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
            </div>



            {/* Input Form */}
            <form onSubmit={(e) => onSubmit(e)} className="relative mt-auto">
                <input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Inquire about performance..."
                    className="w-full bg-muted/50 border border-border/50 rounded-[24px] py-5 pl-5 pr-14 text-sm italic font-serif focus:outline-none focus:bg-card focus:ring-4 focus:ring-primary/5 transition-all text-foreground placeholder:text-muted-foreground shadow-sm"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !inputValue.trim()}
                    className="absolute right-2 top-2 bottom-2 w-11 bg-primary rounded-[18px] flex items-center justify-center text-primary-foreground hover:bg-foreground hover:text-background disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
                >
                    <Send size={16} />
                </button>
            </form>
            <p className="text-[9px] text-muted-foreground/70 text-center mt-3 px-6 leading-relaxed max-w-[280px] mx-auto uppercase tracking-tighter">
                {profile?.ai_name || "ECHO-P1"} responses are AI generated. AI can get things wrong, always confirm with other sources. Consult with a professional for medical or physiological concerns.
            </p>
        </div>
    );
}
