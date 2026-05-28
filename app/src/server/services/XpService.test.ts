import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/server/db', () => ({ db: {} }))

import { XpService, xpService } from './XpService'

interface TxLike {
  user: {
    findUnique: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
}

function buildTx(plan?: { xpBonusPercent: number }): TxLike {
  return {
    user: {
      findUnique: vi.fn(async () => (plan ? { plan } : null)),
      update: vi.fn(async () => undefined)
    }
  }
}

describe('XpService', () => {
  let service: XpService

  beforeEach(() => {
    service = new XpService()
  })

  it('rewardFor_returns_50_for_lesson_passed', () => {
    expect(service.rewardFor('lesson.passed')).toBe(50)
  })

  it('rewardFor_returns_500_for_course_finished', () => {
    expect(service.rewardFor('course.finished')).toBe(500)
  })

  it('award_lesson_passed_with_no_plan_adds_50', async () => {
    const tx = buildTx()
    const userId = faker.string.uuid()
    const delta = await service.award(userId, 'lesson.passed', tx as never)
    expect(delta).toBe(50)
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { totalXp: { increment: 50 } }
    })
  })

  it('award_lesson_passed_with_25_percent_bonus_adds_63', async () => {
    const tx = buildTx({ xpBonusPercent: 25 })
    const userId = faker.string.uuid()
    const delta = await service.award(userId, 'lesson.passed', tx as never)
    expect(delta).toBe(63)
  })

  it('award_with_zero_bonus_increments_exact_amount', async () => {
    const tx = buildTx({ xpBonusPercent: 0 })
    const delta = await service.award(faker.string.uuid(), 'course.finished', tx as never)
    expect(delta).toBe(500)
  })

  it('singleton_xpService_is_exported', () => {
    expect(xpService).toBeInstanceOf(XpService)
  })
})
