import { describe, expect, it } from 'vitest'

import { normalizeStarterCodeMap, starterCodeForLanguage } from './taskStarterCodes'

describe('normalizeStarterCodeMap', () => {
  it('lowercases_keys_and_keeps_strings', () => {
    expect(normalizeStarterCodeMap({ PYTHON: 'x', php: 'y' })).toEqual({ python: 'x', php: 'y' })
  })

  it('drops_non_string_values', () => {
    expect(normalizeStarterCodeMap({ python: 1 })).toEqual({})
  })

  it('returns_empty_for_non_object', () => {
    expect(normalizeStarterCodeMap(null)).toEqual({})
    expect(normalizeStarterCodeMap([1, 2])).toEqual({})
  })
})

describe('starterCodeForLanguage', () => {
  it('starter_for_python_returned_when_available', () => {
    expect(
      starterCodeForLanguage({
        starterCodes: { python: 'print(1)' },
        predefinedCode: null,
        language: 'python',
        primaryLanguage: 'python'
      })
    ).toBe('print(1)')
  })

  it('starter_falls_back_to_predefinedCode_only_for_primary_language', () => {
    expect(
      starterCodeForLanguage({
        starterCodes: {},
        predefinedCode: '<?php echo 1;',
        language: 'php',
        primaryLanguage: 'php'
      })
    ).toBe('<?php echo 1;')
  })

  it('starter_returns_empty_when_requested_secondary_language_missing', () => {
    expect(
      starterCodeForLanguage({
        starterCodes: { python: 'print(1)' },
        predefinedCode: 'print(1)',
        language: 'php',
        primaryLanguage: 'python'
      })
    ).toBe('')
  })
})
