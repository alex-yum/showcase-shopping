import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { authClient } from '@/lib/auth/client'
import type { LoginResponse } from '@/lib/types/auth'

describe('authClient', () => {
  const mockResponse: LoginResponse = {
    accessToken: 'test-token',
    tokenType: 'Bearer',
    expiresIn: 86400000,
    userId: 1,
    email: 'test@example.com',
  }

  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('saves token to localStorage on login', () => {
    authClient.login(mockResponse)
    expect(localStorage.getItem('token')).toBe('test-token')
  })

  it('saves user data to localStorage', () => {
    authClient.login(mockResponse)
    const userData = localStorage.getItem('user')
    expect(userData).toBeTruthy()
    const user = JSON.parse(userData!)
    expect(user.userId).toBe(1)
    expect(user.email).toBe('test@example.com')
  })

  it('getToken() returns stored token', () => {
    localStorage.setItem('token', 'stored-token')
    expect(authClient.getToken()).toBe('stored-token')
  })

  it('getToken() returns null when no token', () => {
    expect(authClient.getToken()).toBeNull()
  })

  it('getUser() returns stored user', () => {
    const user = { userId: 1, email: 'test@example.com' }
    localStorage.setItem('user', JSON.stringify(user))
    expect(authClient.getUser()).toEqual(user)
  })

  it('isAuthenticated() returns true when token exists', () => {
    localStorage.setItem('token', 'test-token')
    expect(authClient.isAuthenticated()).toBe(true)
  })

  it('isAuthenticated() returns false when no token', () => {
    expect(authClient.isAuthenticated()).toBe(false)
  })

  it('logout() clears token and user', () => {
    localStorage.setItem('token', 'test-token')
    localStorage.setItem('user', JSON.stringify({ userId: 1 }))

    authClient.logout()

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('logout() is idempotent — calling twice is safe and stays cleared', () => {
    localStorage.setItem('token', 'test-token')
    localStorage.setItem('user', JSON.stringify({ userId: 1 }))

    authClient.logout()
    authClient.logout()

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('getUser() returns null when no user is stored', () => {
    expect(authClient.getUser()).toBeNull()
  })

  describe('SSR guards (window === undefined)', () => {
    let originalWindow: typeof globalThis.window

    beforeEach(() => {
      originalWindow = globalThis.window
      // @ts-expect-error simulate a server-rendering environment with no window
      delete globalThis.window
    })

    afterEach(() => {
      globalThis.window = originalWindow
    })

    it('getToken() returns null when window is undefined', () => {
      expect(authClient.getToken()).toBeNull()
    })

    it('getUser() returns null when window is undefined', () => {
      expect(authClient.getUser()).toBeNull()
    })

    it('isAuthenticated() returns false when window is undefined', () => {
      expect(authClient.isAuthenticated()).toBe(false)
    })

    it('login() does not throw when window is undefined', () => {
      expect(() => authClient.login(mockResponse)).not.toThrow()
    })

    it('logout() does not throw when window is undefined', () => {
      expect(() => authClient.logout()).not.toThrow()
    })
  })
})
