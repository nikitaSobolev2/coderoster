import { describe, expect, it, vi } from 'vitest'

vi.mock('~/server/db', () => ({ db: {} }))

import { FakeProfileRepository } from './profile.repository'

describe('FakeProfileRepository', () => {
  const repo = new FakeProfileRepository()

  it('getByUsername_returns_null_for_unknown_user', async () => {
    expect(await repo.getByUsername('not-a-user', null)).toBeNull()
  })

  it('getByUsername_marks_isOwner_when_viewer_matches_id', async () => {
    const profile = await repo.getByUsername('codenikita', 'user-1')
    expect(profile?.isOwner).toBe(true)
  })

  it('getByUsername_marks_isOwner_false_for_other_viewer', async () => {
    const profile = await repo.getByUsername('codenikita', 'someone-else')
    expect(profile?.isOwner).toBe(false)
  })

  it('getActivity_returns_365_cells_for_2026', async () => {
    const cells = await repo.getActivity('codenikita', 2026)
    expect(cells.length).toBe(365)
  })

  it('getActivity_levels_match_pickLevel_buckets', async () => {
    const cells = await repo.getActivity('codenikita', 2026)
    expect(cells.every(c => c.level >= 0 && c.level <= 4)).toBe(true)
  })

  it('getAchievements_marks_earned_for_known_track_ids', async () => {
    const achievements = await repo.getAchievements('codenikita')
    const ids = achievements.filter(a => a.earned).map(a => a.id)
    expect(ids).toContain('first-steps')
    expect(ids).toContain('on-fire')
    expect(ids).toContain('all-clear')
  })

  it('getAchievements_keeps_hidden_locked_when_not_earned', async () => {
    const achievements = await repo.getAchievements('codenikita')
    const hidden = achievements.find(a => a.hidden)
    expect(hidden?.earned).toBe(false)
  })

  it('getAchievements_returns_empty_for_empty_username', async () => {
    expect(await repo.getAchievements('')).toHaveLength(0)
  })
})
