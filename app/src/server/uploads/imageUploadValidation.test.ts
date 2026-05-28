import { faker } from '@faker-js/faker'
import { describe, expect, it } from 'vitest'

import { validateImageUpload } from './imageUploadValidation'

describe('validateImageUpload', () => {
  it('validate_accepts_png_under_4MB_for_avatar', () => {
    const result = validateImageUpload({
      kind: 'AVATAR',
      contentType: 'image/png',
      byteLength: 1_000_000,
      role: 'learner'
    })
    expect(result).toBeNull()
  })

  it('validate_rejects_pdf', () => {
    const result = validateImageUpload({
      kind: 'AVATAR',
      contentType: 'application/pdf',
      byteLength: 100,
      role: 'learner'
    })
    expect(result?.trpcCode).toBe('BAD_REQUEST')
  })

  it('validate_rejects_size_above_avatar_limit', () => {
    const result = validateImageUpload({
      kind: 'AVATAR',
      contentType: 'image/png',
      byteLength: faker.number.int({ min: 5_000_001, max: 10_000_000 }),
      role: 'learner'
    })
    expect(result?.trpcCode).toBe('PAYLOAD_TOO_LARGE')
  })

  it('validate_rejects_admin_only_kind_for_learner', () => {
    const result = validateImageUpload({
      kind: 'COURSE_COVER',
      contentType: 'image/png',
      byteLength: 100_000,
      role: 'learner'
    })
    expect(result?.trpcCode).toBe('FORBIDDEN')
  })

  it('validate_allows_admin_for_admin_only_kind', () => {
    const result = validateImageUpload({
      kind: 'COURSE_COVER',
      contentType: 'image/png',
      byteLength: 1_000_000,
      role: 'admin'
    })
    expect(result).toBeNull()
  })
})
