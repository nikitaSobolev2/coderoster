import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it } from 'vitest'

import { FakeAdminChallengesRepository } from '~/../tests/setup/repositories/fakeAdmin'

describe('FakeAdminChallengesRepository', () => {
  let repo: FakeAdminChallengesRepository

  beforeEach(() => {
    repo = new FakeAdminChallengesRepository()
  })

  it('createDaily_requires_three_tasks', async () => {
    const tasks = [faker.string.uuid(), faker.string.uuid(), faker.string.uuid()]
    await repo.setDaily('2026-04-26', tasks)
    expect(await repo.listDailyByDate('2026-04-26')).toEqual(tasks)
  })

  it('createDaily_throws_when_two_provided', async () => {
    await expect(repo.setDaily('2026-04-26', [faker.string.uuid()])).rejects.toThrow(
      'DAILY_REQUIRES_THREE'
    )
  })

  it('createWeekly_requires_five_tasks', async () => {
    const five = Array.from({ length: 5 }, () => faker.string.uuid())
    await repo.setWeekly('2026-W17', five)
    expect(await repo.listWeekly('2026-W17')).toEqual(five)
  })

  it('listByDate_returns_empty_when_unset', async () => {
    expect(await repo.listDailyByDate('2030-01-01')).toEqual([])
  })
})
