import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MSWProvider, useMSW } from '@/app/msw-provider'

const mockWorkerStart = vi.fn()
vi.mock('@/mocks/browser', () => ({
  worker: {
    start: (...args: unknown[]) => mockWorkerStart(...args),
  },
}))

function Probe() {
  const { mswReady } = useMSW()
  return <div>mswReady: {mswReady ? 'yes' : 'no'}</div>
}

describe('useMSW()', () => {
  it('returns the default context value (mswReady: true) when used outside MSWProvider', () => {
    render(<Probe />)
    expect(screen.getByText(/mswReady: yes/)).toBeInTheDocument()
  })
})

describe('MSWProvider', () => {
  const originalNodeEnv = process.env.NODE_ENV

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.stubEnv('NODE_ENV', originalNodeEnv ?? 'test')
    vi.unstubAllEnvs()
  })

  it('is immediately ready outside development (worker never starts)', () => {
    vi.stubEnv('NODE_ENV', 'test')

    render(
      <MSWProvider>
        <Probe />
      </MSWProvider>
    )

    expect(screen.getByText(/mswReady: yes/)).toBeInTheDocument()
    expect(mockWorkerStart).not.toHaveBeenCalled()
  })

  it('starts not-ready in development, then becomes ready once the worker starts', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    mockWorkerStart.mockResolvedValue(undefined)

    render(
      <MSWProvider>
        <Probe />
      </MSWProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/mswReady: yes/)).toBeInTheDocument()
    })
    expect(mockWorkerStart).toHaveBeenCalledWith({ onUnhandledRequest: 'bypass' })
  })

  it('still becomes ready in development even if the worker fails to start', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    mockWorkerStart.mockRejectedValue(new Error('service worker unavailable'))
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <MSWProvider>
        <Probe />
      </MSWProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/mswReady: yes/)).toBeInTheDocument()
    })

    consoleErrorSpy.mockRestore()
  })
})
