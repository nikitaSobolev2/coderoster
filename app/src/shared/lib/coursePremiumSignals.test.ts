import { describe, expect, it } from 'vitest'

import { inferCatalogPremiumTasksBadge, shouldShowPremiumTasksChip } from './coursePremiumSignals'

describe('inferCatalogPremiumTasksBadge', () => {
  it('badge_shown_when_tierRequired_zero_and_premium_lesson_present', () => {
    expect(inferCatalogPremiumTasksBadge(0, true)).toBe(true)
  })

  it('badge_shown_when_tierRequired_greater_than_zero', () => {
    expect(inferCatalogPremiumTasksBadge(2, false)).toBe(true)
  })

  it('badge_hidden_when_free_course_with_no_premium_lessons', () => {
    expect(inferCatalogPremiumTasksBadge(0, false)).toBe(false)
  })
})

describe('shouldShowPremiumTasksChip', () => {
  it('chip_shown_only_when_premium_tasks_on_free_course', () => {
    expect(shouldShowPremiumTasksChip({ tierRequired: 0, hasPremiumTasks: true })).toBe(true)
  })

  it('chip_hidden_when_tier_greater_than_zero', () => {
    expect(shouldShowPremiumTasksChip({ tierRequired: 2, hasPremiumTasks: true })).toBe(false)
  })

  it('chip_hidden_when_no_premium_tasks_flag', () => {
    expect(shouldShowPremiumTasksChip({ tierRequired: 0, hasPremiumTasks: false })).toBe(false)
  })
})
