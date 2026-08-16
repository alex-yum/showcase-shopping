import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { AuthProvider } from '@/lib/auth/context'
import { useAuth } from '@/lib/hooks/useAuth'

describe('Login Flow Integration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('completes full login flow', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    // Initially not authenticated
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()

    // Perform login
    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'Test123!@#',
        rememberMe: true,
      })
    })

    // Check authentication state
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toEqual({
        userId: 1,
        email: 'test@example.com',
      })
    })

    // Check localStorage
    expect(localStorage.getItem('token')).toBe('mock-jwt-token-12345')
    const userData = localStorage.getItem('user')
    expect(userData).toBeTruthy()
    const user = JSON.parse(userData!)
    expect(user.userId).toBe(1)

    // Perform logout
    await act(async () => {
      await result.current.logout()
    })

    // Check state cleared
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
    })

    // Check localStorage cleared
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('handles login failure', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    // Attempt login with wrong credentials
    await expect(
      act(async () => {
        await result.current.login({
          email: 'wrong@example.com',
          password: 'wrong',
        })
      })
    ).rejects.toThrow()

    // User should not be authenticated
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })
})
