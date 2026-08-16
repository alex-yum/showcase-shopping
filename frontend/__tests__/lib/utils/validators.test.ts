import { describe, it, expect } from 'vitest'
import { loginSchema } from '@/lib/utils/validators'

describe('loginSchema', () => {
  it('validates correct login data', () => {
    const data = {
      email: 'test@example.com',
      password: 'Test123!@#',
      rememberMe: true,
    }

    const result = loginSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const data = {
      email: 'not-an-email',
      password: 'Test123!@#',
    }

    const result = loginSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('email')
    }
  })

  it('rejects password without uppercase', () => {
    const data = {
      email: 'test@example.com',
      password: 'test123!@#',
    }

    const result = loginSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rejects password without lowercase', () => {
    const data = {
      email: 'test@example.com',
      password: 'TEST123!@#',
    }

    const result = loginSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rejects password without digit', () => {
    const data = {
      email: 'test@example.com',
      password: 'TestABC!@#',
    }

    const result = loginSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rejects password without special character', () => {
    const data = {
      email: 'test@example.com',
      password: 'Test123456',
    }

    const result = loginSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rejects password shorter than 8 characters', () => {
    const data = {
      email: 'test@example.com',
      password: 'Te12!@',
    }

    const result = loginSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rejects an empty email with "Email is required"', () => {
    const result = loginSchema.safeParse({ email: '', password: 'Test123!@#' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Email is required')
    }
  })

  it('rejects an empty password with "Password is required"', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Password is required')
    }
  })

  it('rejects a 7-character password (boundary B-1)', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: 'Ab1!xyz' })
    expect(result.success).toBe(false)
  })

  it('accepts an exact 8-character password satisfying all rules (boundary B)', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: 'Ab1!xyzq' })
    expect(result.success).toBe(true)
  })

  it('accepts a 9-character password satisfying all rules (boundary B+1)', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: 'Ab1!xyzqr' })
    expect(result.success).toBe(true)
  })

  it('rejects an email containing a multi-byte emoji', () => {
    const result = loginSchema.safeParse({ email: '😀@example.com', password: 'Test123!@#' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('email')
    }
  })
})
