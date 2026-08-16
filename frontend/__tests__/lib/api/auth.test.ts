import { describe, it, expect, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { authApi } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { server } from '@/mocks/server'
import type { LoginRequest } from '@/lib/types/auth'

describe('authApi', () => {
  it('login() returns access token on success', async () => {
    const request: LoginRequest = {
      email: 'test@example.com',
      password: 'Test123!@#',
    }

    const response = await authApi.login(request)

    expect(response.accessToken).toBe('mock-jwt-token-12345')
    expect(response.tokenType).toBe('Bearer')
    expect(response.userId).toBe(1)
  })

  it('login() throws on invalid credentials', async () => {
    const request: LoginRequest = {
      email: 'wrong@example.com',
      password: 'wrong',
    }

    await expect(authApi.login(request)).rejects.toThrow()
  })

  it('logout() returns success message', async () => {
    const response = await authApi.logout()
    expect(response.message).toBe('Logged out successfully')
  })

  it('validate() returns user data with valid token', async () => {
    const response = await authApi.validate('mock-jwt-token-12345')
    expect(response.valid).toBe(true)
    expect(response.userId).toBe(1)
  })

  it('validate() rejects with 401 for an invalid/expired token', async () => {
    await expect(authApi.validate('expired-or-garbage-token')).rejects.toMatchObject({
      status: 401,
    })
  })

  it('login() rejects with 423 for a locked account', async () => {
    const request: LoginRequest = {
      email: 'locked@example.com',
      password: 'Test123!@#',
    }

    const error = await authApi.login(request).catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(423)
    expect((error as ApiError).data).toMatchObject({
      error: 'Locked',
      lockoutTimeRemaining: expect.any(Number),
    })
  })

  it('login() rejects (not 200) for a SQL injection payload in email', async () => {
    const request: LoginRequest = {
      email: "' OR '1'='1",
      password: "' OR '1'='1",
    }

    await expect(authApi.login(request)).rejects.toMatchObject({ status: 401 })
  })

  it('login() rejects (not 200) for an XSS payload in password', async () => {
    const request: LoginRequest = {
      email: 'test@example.com',
      password: '<script>alert(1)</script>',
    }

    await expect(authApi.login(request)).rejects.toMatchObject({ status: 401 })
  })

  it('login() is idempotent — calling twice yields the same result with no duplicate side effects', async () => {
    const request: LoginRequest = {
      email: 'test@example.com',
      password: 'Test123!@#',
    }

    const first = await authApi.login(request)
    const second = await authApi.login(request)

    expect(first).toEqual(second)
  })

  describe('logout() Authorization header', () => {
    afterEach(() => {
      localStorage.clear()
    })

    it('sends Authorization: Bearer header when a token is stored', async () => {
      let capturedAuthHeader: string | null = null
      server.use(
        http.post('*/api/v1/auth/logout', ({ request }) => {
          capturedAuthHeader = request.headers.get('Authorization')
          return HttpResponse.json({ message: 'Logged out successfully' })
        })
      )

      localStorage.setItem('token', 'mock-jwt-token-12345')

      await authApi.logout()

      expect(capturedAuthHeader).toBe('Bearer mock-jwt-token-12345')
    })

    it('sends no Authorization header when no token is stored', async () => {
      let capturedAuthHeader: string | null = null
      server.use(
        http.post('*/api/v1/auth/logout', ({ request }) => {
          capturedAuthHeader = request.headers.get('Authorization')
          return HttpResponse.json({ message: 'Logged out successfully' })
        })
      )

      localStorage.removeItem('token')

      await authApi.logout()

      expect(capturedAuthHeader).toBeNull()
    })
  })
})
