import { describe, expect, it } from 'vitest'

import { buildTestCaller } from '~/../tests/setup/trpcCallerFactory'

describe('profile router (integration)', () => {
  it('profile_getByUsername_returns_public_profile', async () => {
    const { caller } = buildTestCaller({ user: null })
    const profile = await caller.profile.getByUsername({ username: 'codenikita' })
    expect(profile?.username).toBe('codenikita')
  })

  it('profile_getByUsername_marks_isOwner_for_self', async () => {
    const { caller, user } = buildTestCaller({
      user: {
        id: 'user-1',
        username: 'codenikita',
        email: 'a@b.co',
        displayName: 'Niko',
        role: 'learner',
        bannedUntil: null,
        banReason: null,
        chatBannedUntil: null,
        chatBanReason: null,
        livechatConsentAt: null,
        livechatUsernameColor: null
      }
    })
    const profile = await caller.profile.getByUsername({ username: 'codenikita' })
    expect(user?.id).toBe('user-1')
    expect(profile?.isOwner).toBe(true)
  })

  it('profile_getActivity_returns_cells_for_year', async () => {
    const { caller } = buildTestCaller({ user: null })
    const cells = await caller.profile.getActivity({ username: 'codenikita', year: 2026 })
    expect(cells.length).toBe(365)
  })

  it('profile_getAchievements_returns_earned_and_locked', async () => {
    const { caller } = buildTestCaller({ user: null })
    const achievements = await caller.profile.getAchievements({ username: 'codenikita' })
    expect(achievements.some(a => a.earned)).toBe(true)
    expect(achievements.some(a => !a.earned)).toBe(true)
  })
})
