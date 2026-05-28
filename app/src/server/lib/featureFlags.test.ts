import { faker } from '@faker-js/faker'
import { describe, expect, it } from 'vitest'

import { isTruthyFlag } from './featureFlags'

describe('isTruthyFlag', () => {
  it('isTruthyFlag_returns_true_for_string_true', () => {
    expect(isTruthyFlag('true')).toBe(true)
  })

  it('isTruthyFlag_true_for_one', () => {
    expect(isTruthyFlag('1')).toBe(true)
  })

  it('isTruthyFlag_true_for_yes_case_insensitive', () => {
    expect(isTruthyFlag('YES')).toBe(true)
  })

  it('isTruthyFlag_false_for_zero', () => {
    expect(isTruthyFlag('0')).toBe(false)
  })

  it('isTruthyFlag_false_for_string_false', () => {
    expect(isTruthyFlag('false')).toBe(false)
  })

  it('isTruthyFlag_false_for_undefined', () => {
    expect(isTruthyFlag(undefined)).toBe(false)
  })

  it('isTruthyFlag_false_for_random_word', () => {
    expect(isTruthyFlag(faker.lorem.word())).toBe(false)
  })

  it('isTruthyFlag_returns_boolean_directly_when_boolean', () => {
    expect(isTruthyFlag(true)).toBe(true)
    expect(isTruthyFlag(false)).toBe(false)
  })
})
