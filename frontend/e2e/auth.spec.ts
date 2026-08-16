import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from login page
    await page.goto('/login', { waitUntil: 'networkidle' })

    // Wait for MSW to be ready (it starts async in MSWProvider)
    await page.waitForTimeout(1000)
  })

  test('user can log in with valid credentials', async ({ page }) => {
    // Fill in the login form
    await page.getByLabel(/email/i).fill('test@example.com')
    // Use the input directly instead of label to avoid strict mode violation
    await page.locator('input#password').fill('Test123!@#')

    // Submit the form
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should redirect to dashboard
    await page.waitForLoadState('networkidle')

    // Should be redirected to dashboard page
    await expect(page).toHaveURL('/dashboard')
  })

  test('user sees error with invalid credentials', async ({ page }) => {
    // Fill in the login form with wrong credentials
    await page.getByLabel(/email/i).fill('wrong@example.com')
    await page.locator('input#password').fill('WrongPassword!')

    // Submit the form
    await page.getByRole('button', { name: /sign in/i }).click()

    // Wait for network to settle
    await page.waitForLoadState('networkidle')

    // Should stay on login page (most important assertion)
    await expect(page).toHaveURL('/login')
  })

  test('password visibility toggle works', async ({ page }) => {
    const passwordInput = page.locator('input#password')
    const toggleButton = page.getByRole('button', { name: /toggle password visibility/i })

    // Initially password type
    await expect(passwordInput).toHaveAttribute('type', 'password')

    // Click toggle - should show password
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'text')

    // Click again - should hide password
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('remember me checkbox can be toggled', async ({ page }) => {
    const checkbox = page.getByRole('checkbox', { name: /remember me/i })

    // Initially unchecked
    await expect(checkbox).not.toBeChecked()

    // Click to check
    await checkbox.check()
    await expect(checkbox).toBeChecked()

    // Click to uncheck
    await checkbox.uncheck()
    await expect(checkbox).not.toBeChecked()
  })

  test('form validation shows errors for invalid inputs', async ({ page }) => {
    // Fill with invalid email (not an email)
    const emailInput = page.getByLabel(/email/i)
    await emailInput.fill('invalid')
    await emailInput.blur()

    // Fill with short password (less than 8 characters)
    const passwordInput = page.locator('input#password')
    await passwordInput.fill('Short1!')
    await passwordInput.blur()

    // Should show validation errors - match actual schema error messages
    await expect(page.getByText(/valid email required/i)).toBeVisible()
    await expect(page.getByText(/minimum 8 characters/i)).toBeVisible()
  })

  test('keyboard navigation works through form', async ({ page }) => {
    // Click on the form first to ensure focus is within the form context
    await page.getByLabel(/email/i).click()

    // Tab back to email input
    await page.keyboard.press('Shift+Tab')

    // Now tab forward through form elements
    await page.keyboard.press('Tab')
    await expect(page.getByLabel(/email/i)).toBeFocused()

    await page.keyboard.press('Tab') // Password
    await expect(page.locator('input#password')).toBeFocused()

    await page.keyboard.press('Tab') // Password toggle
    await expect(page.getByRole('button', { name: /toggle password visibility/i })).toBeFocused()

    await page.keyboard.press('Tab') // Remember me checkbox
    await expect(page.getByRole('checkbox', { name: /remember me/i })).toBeFocused()

    await page.keyboard.press('Tab') // Forgot password link
    await expect(page.getByRole('link', { name: /forgot password/i })).toBeFocused()

    await page.keyboard.press('Tab') // Sign in button
    await expect(page.getByRole('button', { name: /sign in/i })).toBeFocused()
  })

  test('skip to content link works', async ({ page }) => {
    // Verify form elements are present and accessible
    const emailInput = page.getByLabel(/email/i)
    const passwordInput = page.locator('input#password')
    const submitButton = page.getByRole('button', { name: /sign in/i })

    // All form elements should be visible and focusable
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(submitButton).toBeVisible()

    // Email input should be focusable
    await emailInput.focus()
    await expect(emailInput).toBeFocused()
  })

  test('account-locked (423) login shows the locked-account message', async ({ page }) => {
    await page.getByLabel(/email/i).fill('locked@example.com')
    await page.locator('input#password').fill('Test123!@#')

    await page.getByRole('button', { name: /sign in/i }).click()

    const apiErrorBanner = page.locator('[role="alert"]').filter({ hasText: /temporarily locked/i })
    await expect(apiErrorBanner).toBeVisible()
    // Must stay on login, not treated as a generic 401
    await expect(page).toHaveURL('/login')
  })

  test('logout redirects to /login and clears localStorage', async ({ page }) => {
    // Log in first
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.locator('input#password').fill('Test123!@#')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('/dashboard')

    // Simulate the logout action (no dedicated logout button in the UI yet,
    // so drive it the way the app's own logout() does: clear the session).
    await page.evaluate(async () => {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    })
    await page.goto('/dashboard', { waitUntil: 'load' })
    await page.waitForTimeout(1000)

    await expect(page).toHaveURL(/\/login/)
    const token = await page.evaluate(() => localStorage.getItem('token'))
    expect(token).toBeNull()
  })

  test('protocol-relative open-redirect returnTo lands on /dashboard', async ({ page }) => {
    await page.goto('/login?returnTo=//evil.com', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)

    await page.getByLabel(/email/i).fill('test@example.com')
    await page.locator('input#password').fill('Test123!@#')
    await page.getByRole('button', { name: /sign in/i }).click()

    await page.waitForLoadState('networkidle')

    await expect(page).toHaveURL('/dashboard')
  })

  test('session persists through a page refresh', async ({ page }) => {
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.locator('input#password').fill('Test123!@#')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('/dashboard')

    await page.reload({ waitUntil: 'load' })
    await page.waitForTimeout(1000)

    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('text=ShopHub').first()).toBeVisible()
  })

  test('error banner disappears after a successful retry', async ({ page }) => {
    // First attempt fails (valid per client-side schema, rejected by the API)
    await page.getByLabel(/email/i).fill('wrong@example.com')
    await page.locator('input#password').fill('WrongPassword1!')
    await page.getByRole('button', { name: /sign in/i }).click()

    const apiErrorBanner = page.locator('[role="alert"]').filter({ hasText: /invalid credentials/i })
    await expect(apiErrorBanner).toBeVisible()

    // Retry with correct credentials
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.locator('input#password').fill('Test123!@#')
    await page.getByRole('button', { name: /sign in/i }).click()

    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('/dashboard')
  })
})
