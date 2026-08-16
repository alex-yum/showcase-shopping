import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn()', () => {
  it('merges plain class name strings', () => {
    expect(cn('px-2', 'py-4')).toBe('px-2 py-4')
  })

  it('resolves conflicting Tailwind classes, keeping the last one', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('ignores falsy/undefined values', () => {
    expect(cn('px-2', undefined, null, false, '')).toBe('px-2')
  })

  it('returns an empty string when called with no args', () => {
    expect(cn()).toBe('')
  })

  it('supports conditional object syntax', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active')
  })
})
