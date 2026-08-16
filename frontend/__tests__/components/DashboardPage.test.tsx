import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import DashboardPage from '@/app/(dashboard)/dashboard/page'
import { server } from '@/mocks/server'
import { errorHandlers } from '@/mocks/handlers'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/dashboard',
}))

const mockUseAuth = vi.fn()
vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

const mockUseMSW = vi.fn()
vi.mock('@/app/msw-provider', () => ({
  useMSW: () => mockUseMSW(),
}))

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockUseMSW.mockReturnValue({ mswReady: true })
    mockUseAuth.mockReturnValue({
      user: { userId: 1, email: 'test@example.com' },
      isAuthenticated: true,
      isLoading: false,
    })
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('renders orders, products, and stats on the happy path', async () => {
    localStorage.setItem('token', 'mock-jwt-token-12345')

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText(/welcome back, test/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/order #1234/i)).toBeInTheDocument()
    expect(screen.getByText('Premium Cotton T-Shirt')).toBeInTheDocument()
    expect(screen.getByText(/2,450/)).toBeInTheDocument()
  })

  it('shows "Authentication required" when there is no token (null-token guard)', async () => {
    // No token set in localStorage

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText(/authentication required/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('shows an error banner and retry button when the orders fetch returns 500', async () => {
    localStorage.setItem('token', 'mock-jwt-token-12345')
    server.use(errorHandlers.ordersServerError)

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText(/error loading dashboard/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('shows a full error state when all three fetches fail', async () => {
    localStorage.setItem('token', 'mock-jwt-token-12345')
    server.use(
      errorHandlers.ordersServerError,
      errorHandlers.productsServerError,
      errorHandlers.statsServerError
    )

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText(/error loading dashboard/i)).toBeInTheDocument()
    })
  })

  it('does not fetch data while MSW is not ready', () => {
    mockUseMSW.mockReturnValue({ mswReady: false })
    localStorage.setItem('token', 'mock-jwt-token-12345')

    render(<DashboardPage />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('retry button triggers a full page reload', async () => {
    localStorage.setItem('token', 'mock-jwt-token-12345')
    server.use(errorHandlers.ordersServerError)

    const reloadSpy = vi.fn()
    const originalLocation = window.location
    // @ts-expect-error jsdom does not implement navigation, so stub it
    delete window.location
    window.location = { ...originalLocation, reload: reloadSpy } as Location

    const user = userEvent.setup()
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /retry/i }))

    expect(reloadSpy).toHaveBeenCalledTimes(1)

    window.location = originalLocation
  })

  it('sends an Authorization: Bearer header on the orders request', async () => {
    localStorage.setItem('token', 'mock-jwt-token-12345')
    let capturedAuthHeader: string | null = null
    server.use(
      http.get('*/api/v1/orders', ({ request }) => {
        capturedAuthHeader = request.headers.get('Authorization')
        return HttpResponse.json({ orders: [] })
      })
    )

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText(/welcome back, test/i)).toBeInTheDocument()
    })

    expect(capturedAuthHeader).toBe('Bearer mock-jwt-token-12345')
  })

  it('renders gracefully when the orders array is empty', async () => {
    localStorage.setItem('token', 'mock-jwt-token-12345')
    server.use(http.get('*/api/v1/orders', () => HttpResponse.json({ orders: [] })))

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText(/welcome back, test/i)).toBeInTheDocument()
    })
    expect(screen.queryByText(/order #/i)).not.toBeInTheDocument()
  })

  it('renders gracefully when the products array is empty', async () => {
    localStorage.setItem('token', 'mock-jwt-token-12345')
    server.use(http.get('*/api/v1/products/recommendations', () => HttpResponse.json({ products: [] })))

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText(/welcome back, test/i)).toBeInTheDocument()
    })
    expect(screen.queryByText('Add to Cart')).not.toBeInTheDocument()
  })
})
