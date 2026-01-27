"use client";

import { useChat, type UIMessage } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Send, Bot, HeartPulse, AlertCircle } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { DEMO_USER_ID } from '@/lib/constants';

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
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Create transport once
    const transport = useMemo(() => new DefaultChatTransport({
        api: '/api/chat',
    }), []);

    const {
        messages,
        sendMessage,
        status,
        error: chatError,
    } = useChat({
        transport,
        onError: (err: Error) => {
            console.error('[AiCoach] Error:', err);
            setLocalError(err.message || 'An error occurred. Please try again.');
        },
        onFinish: ({ message }) => {
            console.log('[AiCoach] Message finished:', message.id);
            setLocalError(null);
        },
    });

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
    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        console.log('[AiCoach] Submitting message:', inputValue.substring(0, 50));
        setLocalError(null);

        const messageText = inputValue;
        setInputValue('');

        try {
            await sendMessage({ text: messageText });
        } catch (err) {
            console.error('[AiCoach] Send failed:', err);
            setLocalError('Failed to send message. Please try again.');
        }
    };

    // Extract displayable content from message
    const getMessageContent = (message: UIMessage): string => {
        // Check parts array for text content
        if (message.parts && Array.isArray(message.parts)) {
            const textParts = message.parts
                .filter((part): part is TextPart =>
                    part.type === 'text' && typeof (part as TextPart).text === 'string'
                )
                .map(part => part.text);

            if (textParts.length > 0) {
                return textParts.join('\n');
            }
        }

        return '';
    };

    // Filter out empty messages
    const displayableMessages = messages.filter(m => {
        const content = getMessageContent(m);
        return content.length > 0;
    });

    return (
        <div className="flex flex-col h-full p-4">
            {/* Header / Teaser */}
            <div className="flex items-center gap-4 mb-8">
                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/20 transition-transform duration-200 hover:scale-105">
                    <HeartPulse size={24} className="text-primary-foreground" />
                </div>
                <div>
                    <h3 className="text-xl font-serif text-foreground italic">
                        {profile?.ai_name || "ECHO-P1"}
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                        {profile?.ai_personality ? `${profile.ai_personality} Intelligence` : "Protocol Intelligence"}
                    </p>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 rounded-[32px] overflow-y-auto flex flex-col gap-6 mb-6 scrollbar-hide px-2">
                {displayableMessages.length === 0 && !isLoading && (
                    <div className="flex flex-col items-center justify-center my-auto px-6 text-center space-y-4">
                        <Bot size={40} className="text-muted-foreground/50" />
                        <p className="text-muted-foreground text-sm font-light italic leading-relaxed">
                            &quot;Protocol analysis standby. Ready to optimize your trajectory.&quot;
                        </p>
                        <div className="text-[10px] text-muted-foreground/50 space-y-1">
                            <p>Try asking:</p>
                            <p className="italic">&quot;What&apos;s my workout today?&quot;</p>
                            <p className="italic">&quot;How did I perform this week?&quot;</p>
                        </div>
                    </div>
                )}

                {displayableMessages.map((m) => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] rounded-[24px] px-6 py-4 text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user'
                                ? 'bg-foreground text-background rounded-br-none shadow-xl'
                                : 'bg-muted text-foreground rounded-bl-none border border-border shadow-lg shadow-black/5'
                            }`}>
                            {getMessageContent(m)}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-muted text-muted-foreground rounded-full px-6 py-2 text-[10px] uppercase font-bold tracking-widest animate-pulse border border-border">
                            Analyzing...
                        </div>
                    </div>
                )}

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
            <form onSubmit={onSubmit} className="relative mt-auto">
                <input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Inquire about performance..."
                    className="w-full bg-muted border border-border rounded-[24px] py-6 pl-6 pr-16 text-sm italic font-serif focus:outline-none focus:bg-card focus:ring-4 focus:ring-primary/5 transition-all text-foreground placeholder:text-muted-foreground shadow-inner"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !inputValue.trim()}
                    className="absolute right-2 top-2 bottom-2 w-12 bg-primary rounded-[18px] flex items-center justify-center text-primary-foreground hover:bg-foreground hover:text-background disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl shadow-primary/20"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}
