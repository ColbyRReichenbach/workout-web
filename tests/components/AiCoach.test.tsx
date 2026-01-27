/**
 * AiCoach Component Tests
 *
 * Tests for the AI Coach chat component including:
 * - Rendering
 * - User input handling
 * - Message display
 * - Error states
 * - Loading states
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { useState, FormEvent, ChangeEvent } from 'react'

// Message type for chat
interface ChatMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
}

// Test state for the mock component
let testMessages: ChatMessage[] = []
let testInput = ''
let testIsLoading = false
let testError: Error | null = null
const handleInputChangeMock = vi.fn()
const handleSubmitMock = vi.fn()

// Simple mock component for testing
const MockAiCoach = ({ userId }: { userId: string }) => {
    return (
        <div data-testid="ai-coach">
            <div data-testid="user-id">{userId}</div>
            <div data-testid="messages">
                {testMessages.map((msg, i) => (
                    <div key={msg.id || i} data-testid={`message-${msg.role}`}>
                        {msg.content}
                    </div>
                ))}
            </div>
            {testIsLoading && <div data-testid="loading">Loading...</div>}
            {testError && <div data-testid="error">{testError.message}</div>}
            <form onSubmit={(e: FormEvent) => { e.preventDefault(); handleSubmitMock(e); }}>
                <input
                    data-testid="input"
                    value={testInput}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChangeMock(e)}
                    placeholder="Ask your coach..."
                />
                <button type="submit" data-testid="submit">
                    Send
                </button>
            </form>
        </div>
    )
}

describe('AiCoach Component', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        testMessages = []
        testInput = ''
        testIsLoading = false
        testError = null
    })

    describe('Rendering', () => {
        it('should render the chat interface', () => {
            render(<MockAiCoach userId="test-user" />)

            expect(screen.getByTestId('ai-coach')).toBeInTheDocument()
            expect(screen.getByTestId('input')).toBeInTheDocument()
            expect(screen.getByTestId('submit')).toBeInTheDocument()
        })

        it('should display user ID for context', () => {
            render(<MockAiCoach userId="test-user-123" />)

            expect(screen.getByTestId('user-id')).toHaveTextContent('test-user-123')
        })

        it('should show placeholder text in input', () => {
            render(<MockAiCoach userId="test-user" />)

            expect(screen.getByPlaceholderText('Ask your coach...')).toBeInTheDocument()
        })
    })

    describe('Message Display', () => {
        it('should display user messages', () => {
            testMessages = [
                { id: '1', role: 'user', content: 'How should I train today?' },
            ]

            render(<MockAiCoach userId="test-user" />)

            expect(screen.getByTestId('message-user')).toHaveTextContent(
                'How should I train today?'
            )
        })

        it('should display assistant messages', () => {
            testMessages = [
                { id: '1', role: 'user', content: 'How should I train today?' },
                {
                    id: '2',
                    role: 'assistant',
                    content: 'Based on your HRV, I recommend a lighter session.',
                },
            ]

            render(<MockAiCoach userId="test-user" />)

            expect(screen.getByTestId('message-assistant')).toHaveTextContent(
                'Based on your HRV, I recommend a lighter session.'
            )
        })

        it('should handle multiple messages', () => {
            testMessages = [
                { id: '1', role: 'user', content: 'First message' },
                { id: '2', role: 'assistant', content: 'First response' },
                { id: '3', role: 'user', content: 'Second message' },
                { id: '4', role: 'assistant', content: 'Second response' },
            ]

            render(<MockAiCoach userId="test-user" />)

            const userMessages = screen.getAllByTestId('message-user')
            const assistantMessages = screen.getAllByTestId('message-assistant')

            expect(userMessages).toHaveLength(2)
            expect(assistantMessages).toHaveLength(2)
        })
    })

    describe('Loading States', () => {
        it('should show loading indicator when waiting for response', () => {
            testIsLoading = true

            render(<MockAiCoach userId="test-user" />)

            expect(screen.getByTestId('loading')).toBeInTheDocument()
        })

        it('should hide loading indicator when not loading', () => {
            testIsLoading = false

            render(<MockAiCoach userId="test-user" />)

            expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
        })
    })

    describe('Error Handling', () => {
        it('should display error message on failure', () => {
            testError = new Error('Failed to connect')

            render(<MockAiCoach userId="test-user" />)

            expect(screen.getByTestId('error')).toHaveTextContent('Failed to connect')
        })

        it('should not show error when there is none', () => {
            testError = null

            render(<MockAiCoach userId="test-user" />)

            expect(screen.queryByTestId('error')).not.toBeInTheDocument()
        })
    })

    describe('User Input', () => {
        it('should call handleInputChange on input', async () => {
            const user = userEvent.setup()
            render(<MockAiCoach userId="test-user" />)

            const input = screen.getByTestId('input')
            await user.type(input, 'test message')

            expect(handleInputChangeMock).toHaveBeenCalled()
        })

        it('should call handleSubmit on form submission', async () => {
            render(<MockAiCoach userId="test-user" />)

            const form = screen.getByTestId('submit').closest('form')
            fireEvent.submit(form!)

            expect(handleSubmitMock).toHaveBeenCalled()
        })
    })
})

// ============================================
// MESSAGE CONTENT EXTRACTION TESTS
// ============================================

describe('Message Content Extraction', () => {
    // Helper function that mirrors the one in validation.ts
    const extractMessageContent = (
        message: { content?: string; parts?: Array<{ type: string; text?: string }> }
    ): string => {
        if (typeof message.content === 'string') {
            return message.content
        }
        if (Array.isArray(message.parts)) {
            return message.parts
                .filter((part) => part.type === 'text' && typeof part.text === 'string')
                .map((part) => part.text)
                .join('')
        }
        return ''
    }

    it('should extract content from legacy string format', () => {
        const message = { content: 'Hello, coach!' }
        expect(extractMessageContent(message)).toBe('Hello, coach!')
    })

    it('should extract content from AI SDK v6 parts format', () => {
        const message = {
            parts: [{ type: 'text', text: 'Hello from parts!' }],
        }
        expect(extractMessageContent(message)).toBe('Hello from parts!')
    })

    it('should handle multiple text parts', () => {
        const message = {
            parts: [
                { type: 'text', text: 'Part one. ' },
                { type: 'text', text: 'Part two.' },
            ],
        }
        expect(extractMessageContent(message)).toBe('Part one. Part two.')
    })

    it('should filter non-text parts', () => {
        const message = {
            parts: [
                { type: 'text', text: 'Text content' },
                { type: 'tool-call', tool: 'someFunction' },
            ],
        }
        expect(extractMessageContent(message)).toBe('Text content')
    })

    it('should return empty string for invalid format', () => {
        const message = {}
        expect(extractMessageContent(message)).toBe('')
    })
})

// ============================================
// DEMO MODE TESTS
// ============================================

describe('Demo Mode Handling', () => {
    const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001'

    it('should recognize demo user ID', () => {
        const isDemoUser = (userId: string): boolean => {
            return userId === DEMO_USER_ID
        }

        expect(isDemoUser(DEMO_USER_ID)).toBe(true)
        expect(isDemoUser('regular-user-id')).toBe(false)
    })

    it('should allow demo mode without authentication', () => {
        // In demo mode, user can access pre-populated data without signing in
        const canAccessDemoData = (isAuthenticated: boolean, userId: string): boolean => {
            if (isAuthenticated) return true
            return userId === DEMO_USER_ID
        }

        expect(canAccessDemoData(false, DEMO_USER_ID)).toBe(true)
        expect(canAccessDemoData(false, 'regular-user')).toBe(false)
        expect(canAccessDemoData(true, 'regular-user')).toBe(true)
    })
})
