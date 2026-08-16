import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ApiClient, ApiError } from '@/lib/api/client'

describe('ApiClient', () => {
  let client: ApiClient

  beforeEach(() => {
    client = new ApiClient()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates instance with default baseURL', () => {
    expect(client).toBeInstanceOf(ApiClient)
  })

  it('makes GET request', async () => {
    const result = await client.get<{ valid: boolean }>('/api/v1/auth/validate', {
      headers: { Authorization: 'Bearer mock-jwt-token-12345' },
    })
    expect(result).toHaveProperty('valid')
  })

  it('makes POST request with body', async () => {
    const result = await client.post('/api/v1/auth/login', {
      email: 'test@example.com',
      password: 'Test123!@#',
    })
    expect(result).toHaveProperty('accessToken')
  })

  it('throws error on 401', async () => {
    await expect(
      client.post('/api/v1/auth/login', {
        email: 'wrong@example.com',
        password: 'wrong',
      })
    ).rejects.toThrow()
  })

  it('uses ApiError fallback metadata when error JSON lacks a message', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ code: 'NOPE' }), { status: 418 })
    )

    await expect(client.get('/teapot')).rejects.toMatchObject({
      name: 'ApiError',
      status: 418,
      data: { code: 'NOPE' },
      message: 'API Error',
    } satisfies Partial<ApiError>)
  })

  it('handles empty successful responses as null', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null, { status: 204 }))

    await expect(client.post('/empty')).resolves.toBeNull()
  })

  it('handles non-JSON successful responses as text', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('plain text', { status: 200 }))

    await expect(client.get('/text')).resolves.toBe('plain text')
  })

  it('composes custom base URLs and preserves custom headers', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    )
    const customClient = new ApiClient('https://api.example.test')

    await customClient.get('/api/v1/custom', {
      headers: {
        Authorization: 'Bearer custom',
        'Content-Type': 'application/vnd.api+json',
      },
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/v1/custom',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer custom',
          'Content-Type': 'application/vnd.api+json',
        }),
      })
    )
  })

  it('does not include a body for POST requests without a body', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    )

    await client.post('/api/v1/no-body')

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.not.objectContaining({ body: expect.anything() })
    )
  })
})
