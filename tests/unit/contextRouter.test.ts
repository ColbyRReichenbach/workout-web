import { describe, it, expect } from 'vitest';
import { detectIntent, Message } from '../../src/lib/ai/contextRouter';

describe('detectIntent (Stateful)', () => {
    it('should detect INJURY intent from direct keywords', () => {
        const messages: Message[] = [
            { role: 'user', content: 'My shoulder hurts during overhead press.' }
        ];
        expect(detectIntent(messages)).toBe('INJURY');
    });

    it('should detect LOGISTICS intent for daily routine queries', () => {
        const messages: Message[] = [
            { role: 'user', content: "What is my workout today?" }
        ];
        expect(detectIntent(messages)).toBe('LOGISTICS');
    });

    it('should carry over INJURY intent for follow-up questions', () => {
        const messages: Message[] = [
            { role: 'user', content: 'I have a sharp pain in my knee.' },
            { role: 'assistant', content: 'I am sorry to hear that. You should stop training...' },
            { role: 'user', content: 'What else can I do?' } // Follow-up
        ];
        expect(detectIntent(messages)).toBe('INJURY');
    });

    it('should carry over PROGRESS intent for analytics follow-ups', () => {
        const messages: Message[] = [
            { role: 'user', content: 'Show me my progress for the last month.' },
            { role: 'assistant', content: 'Here are your stats...' },
            { role: 'user', content: 'Why?' } // Short follow-up
        ];
        expect(detectIntent(messages)).toBe('PROGRESS');
    });

    it('should detect new intent even in follow-up if keywords are present', () => {
        const messages: Message[] = [
            { role: 'user', content: 'My back is sore.' },
            { role: 'assistant', content: 'Rest is advised.' },
            { role: 'user', content: 'Actually, just show me my workout.' } // Explicit change
        ];
        expect(detectIntent(messages)).toBe('LOGISTICS');
    });

    it('should default to GENERAL for unrelated queries', () => {
        const messages: Message[] = [
            { role: 'user', content: 'Hello ECHO-P1!' }
        ];
        expect(detectIntent(messages)).toBe('GENERAL');
    });
});
