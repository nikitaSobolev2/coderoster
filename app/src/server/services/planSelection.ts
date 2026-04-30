import 'server-only'
import type { Prisma } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { db } from '~/server/db'
import { env } from '~/env'
import { achievementService } from '~/server/services/AchievementService'
import { invalidatePlanRelatedCaches } from '~/server/cache/invalidateProfileCaches'

export async function assignPlanToUserWithTx(
  tx: Prisma.TransactionClient,
  input: {
    userId: string
    planId: string
    bypassSelfServeRestriction: boolean
  }
): Promise<{ tierLevel: number }> {
  const plan = await tx.plan.findUnique({ where: { id: input.planId } })
  if (!plan) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'План не найден.' })
  }

  if (plan.tierLevel > 0 && !env.SELF_SERVE_PLANS && !input.bypassSelfServeRestriction) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Смена платного плана сейчас только через администратора.'
    })
  }

  await tx.user.update({
    where: { id: input.userId },
    data: { planId: plan.id }
  })
  await achievementService.evaluate({
    userId: input.userId,
    trigger: 'plan.assigned',
    payload: { tierLevel: plan.tierLevel },
    tx
  })

  return { tierLevel: plan.tierLevel }
}

export async function assignDefaultFreePlanWithTx(
  tx: Prisma.TransactionClient,
  userId: string
): Promise<{ tierLevel: number }> {
  const free = await tx.plan.findFirst({
    where: { isDefaultFree: true },
    select: { id: true }
  })
  if (!free) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Free plan missing' })
  }
  return assignPlanToUserWithTx(tx, {
    userId,
    planId: free.id,
    bypassSelfServeRestriction: true
  })
}

export async function assignPlanToUser(input: {
  userId: string
  planId: string
  bypassSelfServeRestriction: boolean
}): Promise<{ tierLevel: number }> {
  const result = await db.$transaction(async tx => assignPlanToUserWithTx(tx, input))
  await invalidatePlanRelatedCaches(input.userId)
  return result
}
