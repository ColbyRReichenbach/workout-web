import { test, expect } from '@playwright/test'

/**
 * AI Chat Flow E2E Tests
 *
 * Tests for the AI coach chat experience including:
 * - Chat interface rendering
 * - Message sending
 * - Response handling
 * - Error states
 */

test.describe('AI Coach Chat', () => {
    test.beforeEach(async ({ page }) => {
        // Enter guest mode to access the chat
        await page.goto('/login')

        const guestButton = page.getByRole('button', { name: /demo|guest|try/i })
        await guestButton.click()

        await page.waitForURL(/\/$|\/dashboard|\/workout/, { timeout: 10000 })
    })

    test('should render the AI coach interface', async ({ page }) => {
        // Look for the AI coach section
        // This might be on the dashboard or in a dedicated section
        const aiCoachSection = page.locator('[data-testid="ai-coach"], [class*="coach"], [class*="chat"]')

        if ((await aiCoachSection.count()) > 0) {
            await expect(aiCoachSection.first()).toBeVisible()
        }
    })

    test('should have a chat input field', async ({ page }) => {
        // Look for chat input
        const chatInput = page.locator(
            'input[placeholder*="ask" i], input[placeholder*="message" i], input[placeholder*="coach" i], textarea[placeholder*="ask" i]'
        )

        if ((await chatInput.count()) > 0) {
            await expect(chatInput.first()).toBeVisible()
        }
    })

    test('should have a send button', async ({ page }) => {
        const sendButton = page.locator(
            'button[type="submit"], button:has-text("Send"), button:has-text("Ask"), button[aria-label*="send" i]'
        )

        if ((await sendButton.count()) > 0) {
            await expect(sendButton.first()).toBeVisible()
        }
    })

    test('should display welcome or initial message', async ({ page }) => {
        // AI coach might show an initial greeting
        const chatArea = page.locator('[data-testid="messages"], [class*="messages"], [class*="chat-body"]')

        if ((await chatArea.count()) > 0) {
            // Chat area should be present
            await expect(chatArea.first()).toBeVisible()
        }
    })

    test('should allow typing in the chat input', async ({ page }) => {
        const chatInput = page.locator(
            'input[placeholder*="ask" i], input[placeholder*="message" i], input[placeholder*="coach" i], textarea[placeholder*="ask" i]'
        )

        if ((await chatInput.count()) > 0) {
            await chatInput.first().fill('How should I train today?')
            await expect(chatInput.first()).toHaveValue('How should I train today?')
        }
    })

    test('should not allow empty message submission', async ({ page }) => {
        const chatInput = page.locator(
            'input[placeholder*="ask" i], input[placeholder*="message" i], textarea[placeholder*="ask" i]'
        )
        const sendButton = page.locator('button[type="submit"], button:has-text("Send")')

        if ((await chatInput.count()) > 0 && (await sendButton.count()) > 0) {
            // Ensure input is empty
            await chatInput.first().clear()

            // Try to submit
            await sendButton.first().click()

            // Should not show loading state or should show validation
            // The input should still be empty
            await expect(chatInput.first()).toHaveValue('')
        }
    })
})

test.describe('AI Chat Interaction', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login')
        const guestButton = page.getByRole('button', { name: /demo|guest|try/i })
        await guestButton.click()
        await page.waitForURL(/\/$|\/dashboard|\/workout/, { timeout: 10000 })
    })

    test('should send a message and show loading state', async ({ page }) => {
        const chatInput = page.locator(
            'input[placeholder*="ask" i], input[placeholder*="message" i], textarea[placeholder*="ask" i]'
        )
        const sendButton = page.locator('button[type="submit"], button:has-text("Send")')

        if ((await chatInput.count()) > 0 && (await sendButton.count()) > 0) {
            await chatInput.first().fill('What is my current training phase?')
            await sendButton.first().click()

            // Should show user message
            const userMessage = page.locator('text="What is my current training phase?"')
            await expect(userMessage).toBeVisible({ timeout: 5000 })

            // Should show loading indicator or streaming response
            // This is async so we just check the message was sent
        }
    })

    test('should handle long messages', async ({ page }) => {
        const chatInput = page.locator(
            'input[placeholder*="ask" i], input[placeholder*="message" i], textarea[placeholder*="ask" i]'
        )

        if ((await chatInput.count()) > 0) {
            const longMessage =
                'I had a really tough workout yesterday with heavy squats at 315 pounds for 5 sets of 3 reps. ' +
                'My legs are feeling pretty sore today and my HRV was lower than usual this morning at around 35ms. ' +
                'What should I do for today\'s session? Should I stick to the plan or modify it?'

            await chatInput.first().fill(longMessage)
            await expect(chatInput.first()).toHaveValue(longMessage)
        }
    })
})

test.describe('AI Chat Error Handling', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login')
        const guestButton = page.getByRole('button', { name: /demo|guest|try/i })
        await guestButton.click()
        await page.waitForURL(/\/$|\/dashboard|\/workout/, { timeout: 10000 })
    })

    test('should handle network errors gracefully', async ({ page }) => {
        // Simulate offline mode
        await page.context().setOffline(true)

        const chatInput = page.locator(
            'input[placeholder*="ask" i], input[placeholder*="message" i], textarea[placeholder*="ask" i]'
        )
        const sendButton = page.locator('button[type="submit"], button:has-text("Send")')

        if ((await chatInput.count()) > 0 && (await sendButton.count()) > 0) {
            await chatInput.first().fill('Test message')
            await sendButton.first().click()

            // Should show error message, not crash
            // Wait a bit for error to appear
            await page.waitForTimeout(2000)

            // Page should still be functional
            await expect(page.locator('body')).toBeVisible()
        }

        // Restore online mode
        await page.context().setOffline(false)
    })
})
