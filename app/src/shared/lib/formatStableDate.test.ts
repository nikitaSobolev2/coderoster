import { describe, expect, it } from 'vitest'

import { formatStableDateDdMmYyyy } from './formatStableDate'

describe('formatStableDateDdMmYyyy', () => {
  it('stable_date_renders_dd_mm_yyyy_for_iso_string', () => {
    expect(formatStableDateDdMmYyyy('2026-04-26T12:00:00Z')).toBe('26.04.2026')
  })

  it('stable_date_renders_dash_for_null', () => {
    expect(formatStableDateDdMmYyyy(null)).toBe('—')
  })

  it('stable_date_renders_dash_for_invalid_input', () => {
    expect(formatStableDateDdMmYyyy('not-a-date')).toBe('—')
  })

  it('stable_date_pads_single_digit_month_and_day', () => {
    expect(formatStableDateDdMmYyyy('2026-01-05T00:00:00Z')).toBe('05.01.2026')
  })
})
