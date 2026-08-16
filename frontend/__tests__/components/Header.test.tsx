import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Header from '@/components/shared/Header'

// Mock useAuth
const mockUseAuth = vi.fn()
vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

describe('Header', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { userId: 1, email: 'john@example.com' },
      isAuthenticated: true,
      logout: vi.fn(),
    })
  })

  it('renders logo', () => {
    render(<Header />)
    expect(screen.getByText('ShopHub')).toBeInTheDocument()
  })

  it('renders search bar', () => {
    render(<Header />)
    expect(screen.getByPlaceholderText(/search for luxury items/i)).toBeInTheDocument()
  })

  it('renders cart with badge', () => {
    render(<Header />)
    const cart = screen.getByRole('button', { name: /cart/i })
    expect(cart).toBeInTheDocument()
  })

  it('renders notifications button', () => {
    render(<Header />)
    const notifications = screen.getByRole('button', { name: /notifications/i })
    expect(notifications).toBeInTheDocument()
  })

  it('renders user menu with email initial', () => {
    render(<Header />)
    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('renders "U" initial and "User" label when unauthenticated (user is null)', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: vi.fn(),
    })

    render(<Header />)

    expect(screen.getByText('U')).toBeInTheDocument()
    expect(screen.getByText('User')).toBeInTheDocument()
  })
})
