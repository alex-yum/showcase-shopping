import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '@/lib/auth/context'
import { authApi } from '@/lib/api/auth'

vi.mock('@/lib/api/auth', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
  },
}))

function TestComponent() {
  const { user, isAuthenticated, isLoading, setSession, logout } = useAuth()

  return (
    <div>
      <div>Loading: {isLoading ? 'yes' : 'no'}</div>
      <div>Authenticated: {isAuthenticated ? 'yes' : 'no'}</div>
      <div>User: {user?.email || 'none'}</div>
      <button
        onClick={() =>
          setSession({
            accessToken: 'session-token',
            tokenType: 'Bearer',
            expiresIn: 86400,
            userId: 2,
            email: 'session@example.com',
          })
        }
      >
        Set Session
      </button>
      <button onClick={() => void logout()}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(authApi.logout).mockResolvedValue({ message: 'ok' })
  })

  afterEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('provides auth state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByText(/Loading: no/)).toBeInTheDocument()
    expect(screen.getByText(/Authenticated: no/)).toBeInTheDocument()
  })

  it('reads user from localStorage on mount', async () => {
    localStorage.setItem('token', 'test-token')
    localStorage.setItem('user', JSON.stringify({ userId: 1, email: 'test@example.com' }))

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/Authenticated: yes/)).toBeInTheDocument()
      expect(screen.getByText(/User: test@example.com/)).toBeInTheDocument()
    })
  })

  it('throws exact error when useAuth is used outside AuthProvider', () => {
    function OutsideProvider() {
      useAuth()
      return null
    }

    expect(() => render(<OutsideProvider />)).toThrow('useAuth must be used within AuthProvider')
  })

  it('sets session through provider and persists it', async () => {
    const user = userEvent.setup()
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await user.click(screen.getByRole('button', { name: /set session/i }))

    expect(screen.getByText(/Authenticated: yes/)).toBeInTheDocument()
    expect(screen.getByText(/User: session@example.com/)).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBe('session-token')
  })

  it('clears local session even when logout API fails', async () => {
    const user = userEvent.setup()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(authApi.logout).mockRejectedValueOnce(new Error('network'))
    localStorage.setItem('token', 'test-token')
    localStorage.setItem('user', JSON.stringify({ userId: 1, email: 'test@example.com' }))

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => expect(screen.getByText(/Authenticated: yes/)).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /logout/i }))

    await waitFor(() => expect(screen.getByText(/Authenticated: no/)).toBeInTheDocument())
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
    expect(consoleError).toHaveBeenCalledWith(
      'Logout API failed; clearing local session:',
      expect.any(Error)
    )
  })
})
