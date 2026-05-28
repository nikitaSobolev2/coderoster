import { faker } from '@faker-js/faker'
import { describe, expect, it } from 'vitest'

import {
  draftsFromAttemptData,
  mergeDraftSave,
  parseAttemptCurrentData
} from './taskAttemptCurrentData'

describe('parseAttemptCurrentData', () => {
  it('drafts_returns_empty_for_null_data', () => {
    expect(parseAttemptCurrentData(null)).toEqual({})
  })

  it('drafts_returns_empty_for_array_input', () => {
    expect(parseAttemptCurrentData([1, 2, 3])).toEqual({})
  })

  it('drafts_returns_python_when_present', () => {
    const code = faker.lorem.lines(2)
    const parsed = parseAttemptCurrentData({ drafts: { python: code } })
    expect(parsed.drafts?.python).toBe(code)
  })
})

describe('mergeDraftSave', () => {
  it('mergeDraftSave_creates_object_from_null_input', () => {
    const code = faker.lorem.lines(1)
    const merged = mergeDraftSave(null, 'python', code)
    expect(merged.drafts).toEqual({ python: code })
    expect(merged.code).toBe(code)
  })

  it('mergeDraftSave_merges_language_into_existing_payload', () => {
    const prev = { drafts: { python: 'print(1)' }, code: 'print(1)' }
    const merged = mergeDraftSave(prev, 'php', '<?php echo 1;')
    expect(merged.drafts).toEqual({
      python: 'print(1)',
      php: '<?php echo 1;'
    })
    expect(merged.code).toBe('<?php echo 1;')
  })
})

describe('draftsFromAttemptData', () => {
  it('returns_only_requested_languages', () => {
    const drafts = draftsFromAttemptData({ drafts: { python: 'a', php: 'b' } }, ['python'])
    expect(drafts).toEqual({ python: 'a' })
  })

  it('returns_empty_when_no_data', () => {
    expect(draftsFromAttemptData(null, ['python'])).toEqual({})
  })
})
