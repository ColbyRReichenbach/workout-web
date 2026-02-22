import { test, expect } from '@playwright/test'

/**
 * Login Flow E2E Tests
 *
 * Tests for the complete login experience including:
 * - Page rendering
 * - Form validation
 * - Guest mode
 * - OAuth buttons
 * - Error states
 */

test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login')
    })

    test('should render the login page', async ({ page }) => {
        // Check for main login elements
        await expect(page.locator('h1, h2').first()).toBeVisible()
        await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible()
    })

    test('should have email and password inputs', async ({ page }) => {
        await expect(page.getByLabel(/email/i)).toBeVisible()
        await expect(page.getByLabel(/password/i)).toBeVisible()
    })

    test('should have OAuth provider buttons', async ({ page }) => {
        // Look for Google/Apple sign-in options
        const googleButton = page.getByRole('button', { name: /google/i })
        const appleButton = page.getByRole('button', { name: /apple/i })

        // At least one OAuth option should be present
        const hasOAuth = (await googleButton.count()) > 0 || (await appleButton.count()) > 0
        expect(hasOAuth).toBeTruthy()
    })

    test('should have a guest/demo mode option', async ({ page }) => {
        // Look for guest mode or demo button
        const guestButton = page.getByRole('button', { name: /demo|guest|try/i })
        await expect(guestButton).toBeVisible()
    })

    test('should show validation errors for empty form', async ({ page }) => {
        // Click submit without filling in fields
        const submitButton = page.getByRole('button', { name: /sign in|log in/i })
        await submitButton.click()

        // Should show validation message (either HTML5 or custom)
        // Check that form wasn't submitted (still on login page)
        await expect(page).toHaveURL(/login/)
    })

    test('should show validation error for invalid email', async ({ page }) => {
        const emailInput = page.getByLabel(/email/i)
        const passwordInput = page.getByLabel(/password/i)

        await emailInput.fill('not-an-email')
        await passwordInput.fill('Password123!')

        const submitButton = page.getByRole('button', { name: /sign in|log in/i })
        await submitButton.click()

        // Should stay on login page due to validation
        await expect(page).toHaveURL(/login/)
    })

    test('should navigate to signup page', async ({ page }) => {
        const signupLink = page.getByRole('link', { name: /sign up|register|create account/i })

        if ((await signupLink.count()) > 0) {
            await signupLink.click()
            await expect(page).toHaveURL(/signup|register/)
        }
    })
})

test.describe('Guest Mode', () => {
    test('should allow entering guest/demo mode', async ({ page }) => {
        await page.goto('/login')

        const guestButton = page.getByRole('button', { name: /demo|guest|try/i })
        await guestButton.click()

        // Should redirect to dashboard or home
        await page.waitForURL(/\/$|\/dashboard|\/workout|\/onboarding/, { timeout: 10000 })

        // Should have guest mode cookie set
        const cookies = await page.context().cookies()
        const guestCookie = cookies.find((c) => c.name === 'guest-mode')
        expect(guestCookie?.value).toBe('true')
    })

    test('should show demo data in guest mode', async ({ page }) => {
        await page.goto('/login')

        const guestButton = page.getByRole('button', { name: /demo|guest|try/i })
        await guestButton.click()

        await page.waitForURL(/\/$|\/dashboard|\/workout|\/onboarding/, { timeout: 10000 })

        // Page should load without errors
        await expect(page.locator('body')).not.toContainText(/error|failed/i)
    })
})

test.describe('Protected Route Redirect', () => {
    test('should redirect unauthenticated users from dashboard to login', async ({ page }) => {
        // Clear any existing cookies
        await page.context().clearCookies()

        await page.goto('/dashboard')

        // Should be redirected to login
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
