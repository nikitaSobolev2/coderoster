import { faker } from '@faker-js/faker'
import { describe, expect, it } from 'vitest'

import { levelForActivityCount } from './activityHeatmapLevel'

describe('levelForActivityCount', () => {
  it('level_zero_for_zero_count', () => {
    expect(levelForActivityCount(0)).toBe(0)
  })

  it('level_one_for_count_one', () => {
    expect(levelForActivityCount(1)).toBe(1)
  })

  it('level_two_for_two_to_three', () => {
    expect(levelForActivityCount(2)).toBe(2)
    expect(levelForActivityCount(3)).toBe(2)
  })

  it('level_three_for_four_to_five', () => {
    expect(levelForActivityCount(4)).toBe(3)
    expect(levelForActivityCount(5)).toBe(3)
  })

  it('level_four_for_six_plus', () => {
    const large = faker.number.int({ min: 6, max: 50 })
    expect(levelForActivityCount(large)).toBe(4)
  })
})
