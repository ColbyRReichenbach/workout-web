"use client";

import { useChat } from '@ai-sdk/react';
import { Send, Bot, Sparkles, HeartPulse } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function AiCoach() {
    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat() as any;
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        async function fetchProfile() {
            const supabase = createClient();
            const { data } = await supabase.from('profiles').select('ai_name, ai_personality').single();
            setProfile(data);
        }
        fetchProfile();
    }, []);

    return (
        <div className="flex flex-col h-full p-4">
            {/* Header / Teaser */}
            <div className="flex items-center gap-4 mb-8">
                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/20 transition-transform hover:scale-110">
                    <HeartPulse size={24} className="text-white" />
                </div>
                <div>
                    <h3 className="text-xl font-serif text-stone-900 italic">
                        {profile?.ai_name || "ECHO-P1"}
                    </h3>
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                        {profile?.ai_personality ? `${profile.ai_personality} Intelligence` : "Protocol Intelligence"}
                    </p>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 rounded-[32px] overflow-y-auto flex flex-col gap-6 mb-6 scrollbar-hide px-2">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center my-auto px-6 text-center space-y-4">
                        <Bot size={40} className="text-stone-200" />
                        <p className="text-stone-400 text-sm font-light italic leading-relaxed">
                            "Protocol analysis standby. Ready to optimize your trajectory."
                        </p>
                    </div>
                )}

                {messages.map((m: any) => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] rounded-[24px] px-6 py-4 text-sm leading-relaxed ${m.role === 'user'
                            ? 'bg-stone-900 text-white rounded-br-none shadow-xl'
                            : 'bg-white text-stone-700 rounded-bl-none border border-black/[0.03] shadow-lg shadow-black/5'
                            }`}>
                            {m.content}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-stone-50 text-stone-400 rounded-full px-6 py-2 text-[10px] uppercase font-bold tracking-widest animate-pulse border border-black/[0.02]">
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
                    className="w-full bg-stone-50 border border-black/[0.03] rounded-[24px] py-6 pl-6 pr-16 text-sm italic font-serif focus:outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all text-stone-900 placeholder:text-stone-300 shadow-inner"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !input}
                    className="absolute right-2 top-2 bottom-2 w-12 bg-primary rounded-[18px] flex items-center justify-center text-white hover:bg-stone-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl shadow-primary/20"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}
