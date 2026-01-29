"use client";

import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { UIMessage } from '@ai-sdk/react';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    messages: UIMessage[];
}

export default function ReportModal({ isOpen, onClose, messages }: ReportModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Helper to extract content safely (duplicate of AiCoach logic)
    const getMessageContent = (message: any): string => {
        // 1. Check for legacy/standard content property first
        if (typeof message.content === 'string' && message.content.length > 0) return message.content;

        // 2. Check parts array for text content (SDK v6+)
        if (message.parts && Array.isArray(message.parts)) {
            const textParts = message.parts
                .filter((part: any) => part.type === 'text' && typeof part.text === 'string')
                .map((part: any) => part.text);

            if (textParts.length > 0) {
                return textParts.join('\n');
            }
        }

        return ''; // Fallback
    };

    if (!isOpen) return null;

    const handleReport = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages,
                    timestamp: new Date().toISOString(),
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit report');
            }

            setSubmitted(true);
            setTimeout(() => {
                onClose();
                setSubmitted(false); // Reset for next time
            }, 2000);
        } catch (err) {
            console.error('Report submission failed:', err);
            setError('Failed to submit report. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-background border border-border rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[80vh]">

                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <AlertCircle size={18} className="text-orange-500" />
                        Report Issue
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {submitted ? (
                        <div className="text-center py-8 space-y-3">
                            <div className="mx-auto w-12 h-12 bg-green-500/10 text-green-600 rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            </div>
                            <h4 className="font-semibold text-lg">Report Sent</h4>
                            <p className="text-muted-foreground text-sm">Thank you for helping us improve.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Verify the conversation log below before sending. This will help us debug the issue.
                            </p>

                            <div className="bg-muted/50 rounded-lg p-3 text-xs font-mono h-64 overflow-y-auto border border-border">
                                {messages.filter(m => m.role !== 'system').map((m, i) => (
                                    <div key={i} className="mb-3 last:mb-0">
                                        <span className={`font-bold uppercase ${m.role === 'user' ? 'text-primary' : 'text-blue-500'}`}>
                                            {m.role}:
                                        </span>
                                        <div className="pl-2 border-l-2 border-border/50 text-foreground/80 mt-1 whitespace-pre-wrap">
                                            {getMessageContent(m)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {error && (
                                <div className="text-destructive text-sm bg-destructive/10 p-2 rounded border border-destructive/20">
                                    {error}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!submitted && (
                    <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleReport}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                        >
                            {isSubmitting ? 'Sending...' : 'Send Report'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
