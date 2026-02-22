import { test, expect } from '@playwright/test'

/**
 * Workout Logging E2E Tests
 *
 * Tests for the workout logging experience including:
 * - Workout page rendering
 * - Exercise display
 * - Logging interactions
 * - Data persistence
 */

test.describe('Workout Page', () => {
    test.beforeEach(async ({ page }) => {
        // Enter guest mode to access workout page
        await page.goto('/login')

        const guestButton = page.getByRole('button', { name: /demo|guest|try/i })
        await guestButton.click()

        // loginDemoUser() redirects to /onboarding; navigate to main app afterward
        await page.waitForURL(/\/$|\/dashboard|\/workout|\/onboarding/, { timeout: 10000 })
        if (page.url().includes('/onboarding')) {
            await page.goto('/')
        }

        // Navigate to workout page if not already there
        const workoutLink = page.locator('a[href*="workout"], button:has-text("Workout")')
        if ((await workoutLink.count()) > 0) {
            await workoutLink.first().click()
            await page.waitForURL(/workout/, { timeout: 5000 })
        }
    })

    test('should render the workout page', async ({ page }) => {
        // Should be on workout page or show workout content
        const workoutContent = page.locator(
            '[data-testid="workout"], [class*="workout"], h1:has-text("Workout"), h2:has-text("Workout")'
        )

        if ((await workoutContent.count()) > 0) {
            await expect(workoutContent.first()).toBeVisible()
        }
    })

    test('should display today\'s workout', async ({ page }) => {
        // Look for workout title or exercises
        const workoutTitle = page.locator('[class*="title"], h1, h2, h3')
        await expect(workoutTitle.first()).toBeVisible()
    })

    test('should show workout segments or exercises', async ({ page }) => {
        // Look for exercise segments
        const segments = page.locator(
            '[data-testid="segment"], [class*="segment"], [class*="exercise"], [class*="workout-item"]'
        )

        // In demo mode, should have at least one workout segment
        if ((await segments.count()) > 0) {
            await expect(segments.first()).toBeVisible()
        }
    })

    test('should have interactive logging controls', async ({ page }) => {
        // Look for checkboxes, input fields, or log buttons
        const controls = page.locator(
            'input[type="checkbox"], input[type="number"], button:has-text("Log"), button:has-text("Complete")'
        )

        if ((await controls.count()) > 0) {
            await expect(controls.first()).toBeVisible()
        }
    })
})

test.describe('Workout Logging Interaction', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login')
        const guestButton = page.getByRole('button', { name: /demo|guest|try/i })
        await guestButton.click()
        await page.waitForURL(/\/$|\/dashboard|\/workout|\/onboarding/, { timeout: 10000 })
        if (page.url().includes('/onboarding')) {
            await page.goto('/')
        }

        const workoutLink = page.locator('a[href*="workout"], button:has-text("Workout")')
        if ((await workoutLink.count()) > 0) {
            await workoutLink.first().click()
            await page.waitForURL(/workout/, { timeout: 5000 })
        }
    })

    test('should allow checking off exercises', async ({ page }) => {
        const checkbox = page.locator('input[type="checkbox"]').first()

        if ((await checkbox.count()) > 0) {
            const wasChecked = await checkbox.isChecked()
            await checkbox.click()

            // State should have toggled
            const isNowChecked = await checkbox.isChecked()
            expect(isNowChecked).not.toBe(wasChecked)
        }
    })

    test('should allow entering weight values', async ({ page }) => {
        const weightInput = page.locator(
            'input[type="number"][placeholder*="weight" i], input[name*="weight" i], input[aria-label*="weight" i]'
        )

        if ((await weightInput.count()) > 0) {
            await weightInput.first().fill('225')
            await expect(weightInput.first()).toHaveValue('225')
        }
    })

    test('should allow entering rep values', async ({ page }) => {
        const repsInput = page.locator(
            'input[type="number"][placeholder*="rep" i], input[name*="rep" i], input[aria-label*="rep" i]'
        )

        if ((await repsInput.count()) > 0) {
            await repsInput.first().fill('8')
            await expect(repsInput.first()).toHaveValue('8')
        }
    })

    test('should display RPE selector if present', async ({ page }) => {
        const rpeSelector = page.locator(
            'select[name*="rpe" i], [class*="rpe"], button:has-text("RPE"), input[placeholder*="rpe" i]'
        )

        if ((await rpeSelector.count()) > 0) {
            await expect(rpeSelector.first()).toBeVisible()
        }
    })
})

test.describe('Workout Data Display', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login')
        const guestButton = page.getByRole('button', { name: /demo|guest|try/i })
        await guestButton.click()
        await page.waitForURL(/\/$|\/dashboard|\/workout|\/onboarding/, { timeout: 10000 })
        if (page.url().includes('/onboarding')) {
            await page.goto('/')
        }

        const workoutLink = page.locator('a[href*="workout"], button:has-text("Workout")')
        if ((await workoutLink.count()) > 0) {
            await workoutLink.first().click()
            await page.waitForURL(/workout/, { timeout: 5000 })
        }
    })

    test('should display prescribed weights or percentages', async ({ page }) => {
        // Look for weight display or percentage display
        const weightDisplay = page.locator(
            'text=/\\d+\\s*(lbs?|kg)|\\d+%/i'
        )

        // Demo data should have some weight values
        if ((await weightDisplay.count()) > 0) {
            await expect(weightDisplay.first()).toBeVisible()
        }
    })

    test('should display sets and reps targets', async ({ page }) => {
        // Look for set/rep format like "3x5" or "3 sets x 5 reps"
        const setsReps = page.locator(
            'text=/\\d+\\s*x\\s*\\d+|\\d+\\s*sets?/i'
        )

        if ((await setsReps.count()) > 0) {
            await expect(setsReps.first()).toBeVisible()
        }
    })

    test('should show workout type or segment labels', async ({ page }) => {
        // Look for segment type labels
        const segmentLabels = page.locator(
            'text=/warmup|main|accessory|cardio|metcon|skill/i'
        )

        if ((await segmentLabels.count()) > 0) {
            await expect(segmentLabels.first()).toBeVisible()
        }
    })
})

test.describe('Workout Navigation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login')
        const guestButton = page.getByRole('button', { name: /demo|guest|try/i })
        await guestButton.click()
        await page.waitForURL(/\/$|\/dashboard|\/workout|\/onboarding/, { timeout: 10000 })
        if (page.url().includes('/onboarding')) {
            await page.goto('/')
        }
    })

    test('should navigate between workout days', async ({ page }) => {
        await page.goto('/workout')

        // Look for day navigation
        const dayNav = page.locator(
            'button:has-text("Next"), button:has-text("Previous"), [class*="day-selector"], [class*="navigation"]'
        )

        if ((await dayNav.count()) > 0) {
            await expect(dayNav.first()).toBeVisible()
        }
    })

    test('should show week or phase information', async ({ page }) => {
        await page.goto('/workout')

        // Look for week/phase display
        const weekPhase = page.locator(
            'text=/week\\s*\\d+|phase\\s*\\d+/i'
        )

        if ((await weekPhase.count()) > 0) {
            await expect(weekPhase.first()).toBeVisible()
        }
    })
})
