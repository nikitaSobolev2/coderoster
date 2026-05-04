import { describe, expect, it } from 'vitest'

import { normalizeWorkosSessionEmail } from './workosSessionEmail'

describe('normalizeWorkosSessionEmail', () => {
  it('returns trimmed string for valid email', () => {
    expect(normalizeWorkosSessionEmail('  a@b.co  ')).toBe('a@b.co')
  })

  it('returns null for empty and non-strings', () => {
    expect(normalizeWorkosSessionEmail('')).toBeNull()
    expect(normalizeWorkosSessionEmail('   ')).toBeNull()
    expect(normalizeWorkosSessionEmail(null)).toBeNull()
    expect(normalizeWorkosSessionEmail(undefined)).toBeNull()
    expect(normalizeWorkosSessionEmail(1)).toBeNull()
  })
})
