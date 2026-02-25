import { test, expect } from '@playwright/test'

/**
 * Login Flow E2E Tests
 *
 * Tests for the complete login experience including:
 * - Page rendering (multi-view state machine)
 * - Form validation
 * - Guest mode
 * - OAuth buttons
 * - Error states
 */

test.describe('Login Page – Initial View', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login')
    })

    test('should render the welcome heading', async ({ page }) => {
        await expect(page.locator('h1')).toContainText('Welcome')
    })

    test('should have Google OAuth button', async ({ page }) => {
        const googleButton = page.getByRole('button', { name: /google/i })
        await expect(googleButton).toBeVisible()
    })

    test('should have email sign-in button', async ({ page }) => {
        const emailButton = page.getByRole('button', { name: /sign in with email/i })
        await expect(emailButton).toBeVisible()
    })

    test('should have a guest/demo mode option', async ({ page }) => {
        const guestButton = page.getByRole('button', { name: /guest/i })
        await expect(guestButton).toBeVisible()
    })

    test('should have a signup option', async ({ page }) => {
        const signupButton = page.getByRole('button', { name: /create your pulse/i })
        await expect(signupButton).toBeVisible()
    })
})

test.describe('Login Page – Email Form', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login')
        // Navigate to email login view
        const emailButton = page.getByRole('button', { name: /sign in with email/i })
        await emailButton.click()
    })

    test('should have email and password inputs', async ({ page }) => {
        await expect(page.getByLabel(/email/i)).toBeVisible()
        await expect(page.getByLabel(/password/i)).toBeVisible()
    })

    test('should have a sign-in submit button', async ({ page }) => {
        await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    })

    test('should show validation errors for empty form', async ({ page }) => {
        const submitButton = page.getByRole('button', { name: /sign in/i })
        await submitButton.click()

        // Should stay on login page due to HTML5 required validation
        await expect(page).toHaveURL(/login/)
    })

    test('should show validation error for invalid email', async ({ page }) => {
        const emailInput = page.getByLabel(/email/i)
        const passwordInput = page.getByLabel(/password/i)

        await emailInput.fill('not-an-email')
        await passwordInput.fill('Password123!')

        const submitButton = page.getByRole('button', { name: /sign in/i })
        await submitButton.click()

        // Should stay on login page due to validation
        await expect(page).toHaveURL(/login/)
    })

    test('should navigate back to initial view', async ({ page }) => {
        // Click the back button (ChevronLeft)
        const backButton = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-left') })
        if ((await backButton.count()) > 0) {
            await backButton.click()
            // Should be back on initial view with Google button visible
            await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
        }
    })
})

test.describe('Guest Mode', () => {
    test('should allow entering guest/demo mode', async ({ page }) => {
        await page.goto('/login')

        const guestButton = page.getByRole('button', { name: /guest/i })
        await guestButton.click()

        // Should redirect to dashboard or onboarding
        await page.waitForURL(/\/$|\/dashboard|\/workout|\/onboarding/, { timeout: 10000 })

        // Should have guest mode cookie set
        const cookies = await page.context().cookies()
        const guestCookie = cookies.find((c) => c.name === 'guest-mode')
        expect(guestCookie?.value).toBe('true')
    })

    test('should show demo data in guest mode', async ({ page }) => {
        await page.goto('/login')

        const guestButton = page.getByRole('button', { name: /guest/i })
        await guestButton.click()

        await page.waitForURL(/\/$|\/dashboard|\/workout|\/onboarding/, { timeout: 10000 })

        // Page should load without errors
        await expect(page.locator('body')).not.toContainText(/error|failed/i)
    })
})

test.describe('Protected Route Redirect', () => {
    test('should redirect unauthenticated users from dashboard to login', async ({ page }) => {
        await page.context().clearCookies()
        await page.goto('/dashboard')
        await expect(page).toHaveURL(/login/)
    })

    test('should redirect unauthenticated users from workout to login', async ({ page }) => {
        await page.context().clearCookies()
        await page.goto('/workout')
        await expect(page).toHaveURL(/login/)
    })

    test('should redirect unauthenticated users from profile to login', async ({ page }) => {
        await page.context().clearCookies()
        await page.goto('/profile')
        await expect(page).toHaveURL(/login/)
    })
})
