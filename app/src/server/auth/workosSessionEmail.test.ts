import { faker } from '@faker-js/faker'
import { describe, expect, it } from 'vitest'

import { normalizeWorkosSessionEmail } from './workosSessionEmail'

describe('normalizeWorkosSessionEmail', () => {
  it('normalize_returns_trimmed_string_for_valid_email', () => {
    expect(normalizeWorkosSessionEmail('  a@b.co  ')).toBe('a@b.co')
  })

  it('normalize_returns_null_for_empty_and_non_strings', () => {
    expect(normalizeWorkosSessionEmail('')).toBeNull()
    expect(normalizeWorkosSessionEmail('   ')).toBeNull()
    expect(normalizeWorkosSessionEmail(null)).toBeNull()
    expect(normalizeWorkosSessionEmail(undefined)).toBeNull()
    expect(normalizeWorkosSessionEmail(1)).toBeNull()
  })

  it('normalize_preserves_case_for_random_email', () => {
    const email = `  ${faker.internet.email()}  `
    expect(normalizeWorkosSessionEmail(email)).toBe(email.trim())
  })
})
