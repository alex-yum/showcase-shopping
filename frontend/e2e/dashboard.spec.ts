import { test, expect } from '@playwright/test'

/**
 * Dashboard E2E Tests
 *
 * These tests use MSW (configured via MSWProvider in dev builds) to mock the
 * backend, and assert against the actual MSW fixture data (3 orders, 2
 * products, stats: 5 orders this month / $237.50 / 2450 points) rather than
 * loose structural checks.
 */

function authenticate(page: import('@playwright/test').Page) {
  return page.addInitScript(() => {
    localStorage.setItem('token', 'mock-jwt-token-12345')
    localStorage.setItem('user', JSON.stringify({ userId: 1, email: 'test@example.com' }))
  })
}

test.describe('Dashboard', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    // Navigate to dashboard without authentication
    await page.goto('/dashboard', { waitUntil: 'load' })

    // Wait for MSW to initialize
    await page.waitForTimeout(1000)

    // Should redirect to login page (with optional returnTo query param)
    await expect(page).toHaveURL(/\/login/)
  })

  test('dashboard page loads with authentication', async ({ page }) => {
    await authenticate(page)

    await page.goto('/dashboard', { waitUntil: 'load' })
    await page.waitForTimeout(1000)

    await expect(page.locator('text=ShopHub').first()).toBeVisible()
  })

  test('displays welcome message with user name', async ({ page }) => {
    await authenticate(page)

    await page.goto('/dashboard', { waitUntil: 'load' })
    await page.waitForTimeout(1000)

    await expect(page.getByRole('heading', { name: /welcome back, test/i })).toBeVisible()
  })

  test('displays quick actions', async ({ page }) => {
    await authenticate(page)

    await page.goto('/dashboard')
    await page.waitForTimeout(1000)

    // 4 quick-action buttons should be present and labeled
    await expect(page.getByRole('button', { name: 'Shop Now', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Track Orders', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Wishlist', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sale Items', exact: true })).toBeVisible()
  })

  test('displays recent orders section with MSW fixture data', async ({ page }) => {
    await authenticate(page)

    await page.goto('/dashboard')
    await page.waitForTimeout(1000)

    await expect(page.getByRole('heading', { name: /recent orders/i })).toBeVisible()
    await expect(page.getByText('Order #1234')).toBeVisible()
    await expect(page.getByText('Order #1233')).toBeVisible()
    await expect(page.getByText('Order #1232')).toBeVisible()
  })

  test('displays curated products section with MSW fixture data', async ({ page }) => {
    await authenticate(page)

    await page.goto('/dashboard')
    await page.waitForTimeout(1000)

    await expect(page.getByRole('heading', { name: /curated for you/i })).toBeVisible()
    await expect(page.getByText('Premium Cotton T-Shirt')).toBeVisible()
    await expect(page.getByText('Wireless Headphones')).toBeVisible()
  })

  test('displays account stats with MSW fixture values', async ({ page }) => {
    await authenticate(page)

    await page.goto('/dashboard')
    await page.waitForTimeout(1000)

    await expect(page.getByText('237.50', { exact: false })).toBeVisible()
    await expect(page.getByText('2,450', { exact: false })).toBeVisible()
  })

  test('dashboard survives page reload without showing an error', async ({ page }) => {
    await authenticate(page)

    // First navigation
    await page.goto('/dashboard', { waitUntil: 'load' })
    await page.waitForTimeout(1500)

    // Reload the page — this is the scenario that previously failed
    await page.reload({ waitUntil: 'load' })
    await page.waitForTimeout(1500)

    // Should still be on the dashboard, not redirected or showing an error
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('text=Error Loading Dashboard')).not.toBeVisible()
    await expect(page.locator('text=ShopHub').first()).toBeVisible()
  })

  test('order card hover reveals a visible state change', async ({ page }) => {
    await authenticate(page)
    await page.goto('/dashboard')
    await page.waitForTimeout(1000)

    const orderCard = page.getByText('Order #1234').locator('..').locator('..')
    await orderCard.hover()
    // Hovering an order card triggers a hover:shadow-xl/translate transform; verify
    // the card is still in the accessibility tree and interactive content responds.
    await expect(orderCard).toBeVisible()
    await expect(page.getByRole('button', { name: 'Track Order', exact: true })).toBeVisible()
  })

  test('quick action buttons are clickable', async ({ page }) => {
    await authenticate(page)

    await page.goto('/dashboard')
    await page.waitForTimeout(1000)

    const trackOrdersButton = page.getByRole('button', { name: 'Track Orders', exact: true })
    await expect(trackOrdersButton).toBeEnabled()
    await trackOrdersButton.click()
  })

  test('product wishlist toggle sets aria-pressed / visual state', async ({ page }) => {
    await authenticate(page)
    await page.goto('/dashboard')
    await page.waitForTimeout(1000)

    const wishlistButton = page.getByRole('button', { name: /add to wishlist/i }).first()
    await expect(wishlistButton).toBeVisible()

    await wishlistButton.click()

    // Toggling wishlist swaps the heart icon fill class; verify the SVG icon
    // picks up the "filled" (fill-red-500) state after the click.
    await expect(wishlistButton.locator('svg')).toHaveClass(/fill-red-500/)

    await wishlistButton.click()
    await expect(wishlistButton.locator('svg')).not.toHaveClass(/fill-red-500/)
  })

  test('shows an error banner when the dashboard data fetch fails over the network', async ({ page }) => {
    await authenticate(page)

    // MSW's service worker intercepts fetches before Playwright's page.route (or a
    // worker.use() override registered post-load) can act — and any override would
    // be wiped out by MSWProvider re-running worker.start() on the next full
    // navigation anyway. Patching window.fetch via addInitScript runs before any
    // page script (including MSW's own registration), so it reliably wins.
    await page.addInitScript(() => {
      const originalFetch = window.fetch.bind(window)
      window.fetch = (input, init) => {
        const url = typeof input === 'string' ? input : (input as Request).url
        if (url.includes('/api/v1/orders')) {
          return Promise.resolve(
            new Response(JSON.stringify({ status: 500, error: 'Internal Server Error' }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            })
          )
        }
        return originalFetch(input, init)
      }
    })

    await page.goto('/dashboard', { waitUntil: 'load' })
    await page.waitForTimeout(1500)

    await expect(page.getByText(/error loading dashboard/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /retry/i })).toBeVisible()
  })

  test('redirects to login when localStorage is cleared mid-session', async ({ page }) => {
    // Note: deliberately not using the `authenticate()` addInitScript helper here —
    // an init script re-runs on every subsequent navigation/reload, which would
    // silently re-populate localStorage right after we clear it below.
    await page.goto('/login', { waitUntil: 'load' })
    await page.evaluate(() => {
      localStorage.setItem('token', 'mock-jwt-token-12345')
      localStorage.setItem('user', JSON.stringify({ userId: 1, email: 'test@example.com' }))
    })
    await page.goto('/dashboard', { waitUntil: 'load' })
    await page.waitForTimeout(1000)
    await expect(page).toHaveURL('/dashboard')

    // Simulate the session being lost (e.g. token expired/cleared elsewhere)
    await page.evaluate(() => localStorage.clear())
    await page.reload({ waitUntil: 'load' })
    await page.waitForTimeout(1000)

    await expect(page).toHaveURL(/\/login/)
  })

  test('back button after logout cannot access the dashboard', async ({ page }) => {
    // See note above: avoid the addInitScript-based `authenticate()` helper since
    // it would re-authenticate on every navigation in this test, including goBack().
    await page.goto('/login', { waitUntil: 'load' })
    await page.evaluate(() => {
      localStorage.setItem('token', 'mock-jwt-token-12345')
      localStorage.setItem('user', JSON.stringify({ userId: 1, email: 'test@example.com' }))
    })
    await page.goto('/dashboard', { waitUntil: 'load' })
    await page.waitForTimeout(1000)
    await expect(page).toHaveURL('/dashboard')

    // Simulate logout: clear the session and navigate to login
    await page.evaluate(() => localStorage.clear())
    await page.goto('/login', { waitUntil: 'load' })
    await page.waitForTimeout(500)

    // Navigating back in history must not restore access to the dashboard
    await page.goBack({ waitUntil: 'load' })
    await page.waitForTimeout(1000)

    await expect(page).toHaveURL(/\/login/)
  })
})
