"use client";

import { useChat } from '@ai-sdk/react';
import { Send, Bot, HeartPulse } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface AIProfile {
    ai_name: string | null;
    ai_personality: string | null;
}

export default function AiCoach() {
    // We use any here because different versions of the AI SDK have slightly different return types for useChat
    // and we want to ensure compatibility with the runtime while satisfying the linter.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat() as any;
    const [profile, setProfile] = useState<AIProfile | null>(null);

    useEffect(() => {
        async function fetchProfile() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            let query = supabase.from('profiles').select('ai_name, ai_personality');
            if (user) {
                query = query.eq('id', user.id);
            } else {
                query = query.eq('id', '00000000-0000-0000-0000-000000000001');
            }

            const { data } = await query.single();
            setProfile(data);
        }
        fetchProfile();
    }, []);

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
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center my-auto px-6 text-center space-y-4">
                        <Bot size={40} className="text-muted-foreground/50" />
                        <p className="text-muted-foreground text-sm font-light italic leading-relaxed">
                            &quot;Protocol analysis standby. Ready to optimize your trajectory.&quot;
                        </p>
                    </div>
                )}

                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {messages.map((m: any) => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] rounded-[24px] px-6 py-4 text-sm leading-relaxed ${m.role === 'user'
                            ? 'bg-foreground text-background rounded-br-none shadow-xl'
                            : 'bg-muted text-foreground rounded-bl-none border border-border shadow-lg shadow-black/5'
                            }`}>
                            {m.content}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-muted text-muted-foreground rounded-full px-6 py-2 text-[10px] uppercase font-bold tracking-widest animate-pulse border border-border">
                            Processing...
                        </div>
                    </div>
                )}
            </div>

            {/* Input Overlay */}
            <form onSubmit={handleSubmit} className="relative mt-auto">
                <input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Inquire about performance..."
                    className="w-full bg-muted border border-border rounded-[24px] py-6 pl-6 pr-16 text-sm italic font-serif focus:outline-none focus:bg-card focus:ring-4 focus:ring-primary/5 transition-all text-foreground placeholder:text-muted-foreground shadow-inner"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !input}
                    className="absolute right-2 top-2 bottom-2 w-12 bg-primary rounded-[18px] flex items-center justify-center text-primary-foreground hover:bg-foreground hover:text-background disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl shadow-primary/20"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}
