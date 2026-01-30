"use client";

import { useChat, type UIMessage } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Send, Bot, HeartPulse, AlertCircle, Flag } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
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
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Create transport once
    const transport = useMemo(() => new DefaultChatTransport({
        api: '/api/chat',
    }), []);

    const [activeTag, setActiveTag] = useState<string | null>(null);

    const {
        messages,
        sendMessage,
        status,
        error: chatError,
    } = useChat({
        transport,
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
            await sendMessage({ text: messageText });
        } catch (err) {
            console.error('[AiCoach] Send failed:', err);
            setLocalError('Failed to send message. Please try again.');
        }
    };

    // Extract displayable content from message
    const getMessageContent = (message: UIMessage): string => {
        // Cast to any to bypass strict type checking for legacy/flexible fields
        const m = message as any;

        // Log message for debugging
        console.log(`[AiCoach] Processing message ${m.id}:`, {
            role: m.role,
            contentLength: m.content?.length,
            partsCount: m.parts?.length,
            toolInvocations: m.toolInvocations?.length
        });

        // 1. Check for legacy/standard content property first
        if (m.content) return m.content;

        // 2. Check parts array for text content (SDK v6+)
        if (m.parts && Array.isArray(m.parts)) {
            const textParts = m.parts
                .filter((part: any) =>
                    part.type === 'text' && typeof part.text === 'string'
                )
                .map((part: any) => part.text);

            if (textParts.length > 0) {
                return textParts.join('\n');
            }
        }

        return '';
    };

    // Filter out messages that genuinely have no content
    const displayableMessages = messages.filter(m => {
        if (m.role === 'user') return true;
        const content = getMessageContent(m);
        // Only hide Assistant messages that are COMPLETELY empty and have tool calls
        if (m.role === 'assistant' && !content) {
            const tools = (m as any).toolInvocations;
            if (tools && tools.length > 0) return false;
        }
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

                    {displayableMessages.map((m) => (
                        <motion.div
                            key={m.id}
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[95%] rounded-[24px] px-5 py-3.5 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${m.role === 'user'
                                ? 'bg-foreground text-background rounded-br-none'
                                : 'bg-muted/30 text-foreground rounded-bl-none border border-border/50 backdrop-blur-sm'
                                }`}>
                                {getMessageContent(m)}
                            </div>
                        </motion.div>
                    ))}

                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-start"
                        >
                            <div className="bg-muted/50 text-muted-foreground rounded-full px-5 py-2 text-[9px] uppercase font-bold tracking-[0.2em] animate-pulse border border-border/50">
                                Analyzing
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
