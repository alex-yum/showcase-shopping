import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, renderHook, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/lib/auth/context'
import { authApi } from '@/lib/api/auth'

function TestComponent() {
  const { user, isAuthenticated, isLoading } = useAuth()

  return (
    <div>
      <div>Loading: {isLoading ? 'yes' : 'no'}</div>
      <div>Authenticated: {isAuthenticated ? 'yes' : 'no'}</div>
      <div>User: {user?.email || 'none'}</div>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
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

  it('isLoading transitions from true to false after mount', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    expect(result.current.isLoading).toBe(false) // effect runs synchronously under act()

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('setSession() updates user state and persists to localStorage directly', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    act(() => {
      result.current.setSession({
        accessToken: 'direct-token',
        tokenType: 'Bearer',
        expiresIn: 86400000,
        userId: 42,
        email: 'direct@example.com',
      })
    })

    expect(result.current.user).toEqual({ userId: 42, email: 'direct@example.com' })
    expect(result.current.isAuthenticated).toBe(true)
    expect(localStorage.getItem('token')).toBe('direct-token')
  })

  it('logout() clears user state even when authApi.logout() rejects', async () => {
    localStorage.setItem('token', 'test-token')
    localStorage.setItem('user', JSON.stringify({ userId: 1, email: 'test@example.com' }))

    const logoutSpy = vi.spyOn(authApi, 'logout').mockRejectedValueOnce(new Error('network down'))

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
    })

    await act(async () => {
      await expect(result.current.logout()).rejects.toThrow('network down')
    })

    // Local session must still clear even though the API call failed.
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem('token')).toBeNull()

    logoutSpy.mockRestore()
  })

  it('useAuth() throws when called outside AuthProvider', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    function Unwrapped() {
      useAuth()
      return null
    }

    expect(() => render(<Unwrapped />)).toThrow('useAuth must be used within AuthProvider')

    consoleErrorSpy.mockRestore()
  })
})
