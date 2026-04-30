import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'
import { idempotentProcedure } from '~/server/api/procedures'
import { env } from '~/env'
import { db } from '~/server/db'
import { assignPlanToUser } from '~/server/services/planSelection'
import type { PlanSummary } from '~/server/repositories/types'
import { parsePlanMarketingBullets } from '~/shared/plan/planMarketing'

function toPlanSummary(row: {
  id: string
  slug: string
  name: string
  shortDescription: string
  marketingMarkdown: string
  marketingFeatures: unknown
  isBestseller: boolean
  tierLevel: number
  xpBonusPercent: number
  sortOrder: number
  maxActiveCourses: number | null
}): PlanSummary {
  const marketingFeatures = parsePlanMarketingBullets(row.marketingFeatures)
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.shortDescription,
    marketingMarkdown: row.marketingMarkdown,
    marketingFeatures: marketingFeatures.map(b => ({ iconKey: b.iconKey, text: b.text })),
    isBestseller: row.isBestseller,
    tierLevel: row.tierLevel,
    xpBonusPercent: row.xpBonusPercent,
    sortOrder: row.sortOrder,
    maxActiveCourses: row.maxActiveCourses
  }
}

export const planRouter = createTRPCRouter({
  list: publicProcedure.query(async (): Promise<PlanSummary[]> => {
    const rows = await db.plan.findMany({
      orderBy: [{ sortOrder: 'asc' }, { tierLevel: 'asc' }]
    })
    return rows.map(toPlanSummary)
  }),

  getMine: protectedProcedure.query(async ({ ctx }): Promise<PlanSummary | null> => {
    const row = await db.user.findUnique({
      where: { id: ctx.user.id },
      select: { plan: true }
    })
    if (!row?.plan) return null
    return toPlanSummary(row.plan)
  }),

  policies: publicProcedure.query(() => ({
    selfServePaidPlans: env.SELF_SERVE_PLANS,
    /** Mirror for client-only checks when env not bundled */
    nextPublicSelfServe: process.env.NEXT_PUBLIC_SELF_SERVE_PLANS !== 'false'
  })),

  select: idempotentProcedure
    .input(z.object({ planId: z.string().min(1) }))
    .mutation(({ ctx, input }) =>
      assignPlanToUser({
        userId: ctx.user.id,
        planId: input.planId,
        bypassSelfServeRestriction: false
      })
    )
})
