import 'server-only'
import type { Prisma } from '@prisma/client'
import { db } from '~/server/db'
import { sanitizeMarkdown, sanitizePlainText } from '~/server/lib/sanitize'
import type { PlanMarketingBullet } from '~/shared/plan/planMarketing'
import { parsePlanMarketingBullets, planMarketingBulletsSchema } from '~/shared/plan/planMarketing'

export interface AdminPlanRow {
  id: string
  slug: string
  name: string
  shortDescription: string
  marketingMarkdown: string
  marketingFeatures: PlanMarketingBullet[]
  isBestseller: boolean
  tierLevel: number
  xpBonusPercent: number
  sortOrder: number
  isDefaultFree: boolean
  maxActiveCourses: number | null
  userCount: number
  createdAt: Date
  updatedAt: Date
}

export interface AdminPlanCreateInput {
  slug: string
  name: string
  shortDescription?: string
  marketingMarkdown?: string
  marketingFeatures?: PlanMarketingBullet[]
  isBestseller?: boolean
  tierLevel: number
  xpBonusPercent?: number
  sortOrder?: number
  maxActiveCourses?: number | null
  isDefaultFree?: boolean
}

export type AdminPlanUpdateInput = Partial<
  Omit<AdminPlanCreateInput, 'slug' | 'tierLevel'> & { slug: string; tierLevel: number }
>

export class AdminPlansRepository {
  async list(): Promise<AdminPlanRow[]> {
    const rows = await db.plan.findMany({
      orderBy: [{ sortOrder: 'asc' }, { tierLevel: 'asc' }],
      include: { _count: { select: { users: true } } }
    })
    return rows.map(r => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      shortDescription: r.shortDescription,
      marketingMarkdown: r.marketingMarkdown,
      marketingFeatures: this.normalizeFeatures(r.marketingFeatures),
      isBestseller: r.isBestseller,
      tierLevel: r.tierLevel,
      xpBonusPercent: r.xpBonusPercent,
      sortOrder: r.sortOrder,
      isDefaultFree: r.isDefaultFree,
      maxActiveCourses: r.maxActiveCourses,
      userCount: r._count.users,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    }))
  }

  async create(input: AdminPlanCreateInput): Promise<AdminPlanRow> {
    const marketingFeatures = this.sanitizeFeaturesInput(input.marketingFeatures)
    const row = await db.plan.create({
      data: {
        slug: input.slug.trim().toLowerCase(),
        name: sanitizePlainText(input.name),
        shortDescription: sanitizePlainText(input.shortDescription ?? ''),
        marketingMarkdown: sanitizeMarkdown(input.marketingMarkdown ?? ''),
        marketingFeatures,
        isBestseller: input.isBestseller ?? false,
        tierLevel: input.tierLevel,
        xpBonusPercent: input.xpBonusPercent ?? 0,
        sortOrder: input.sortOrder ?? 0,
        ...(input.maxActiveCourses !== undefined
          ? { maxActiveCourses: input.maxActiveCourses }
          : {}),
        isDefaultFree: input.isDefaultFree ?? false
      },
      include: { _count: { select: { users: true } } }
    })
    if (row.isDefaultFree) {
      await this.ensureSingleDefaultFree(row.id)
    }
    if (row.isBestseller) {
      await this.ensureSingleBestseller(row.id)
    }
    return this.toRow(row)
  }

  async update(id: string, patch: AdminPlanUpdateInput): Promise<AdminPlanRow> {
    if (patch.isBestseller === true) {
      await this.ensureSingleBestseller(id)
    }

    const data: Prisma.PlanUpdateInput = {}
    if (patch.slug !== undefined) data.slug = patch.slug.trim().toLowerCase()
    if (patch.name !== undefined) data.name = sanitizePlainText(patch.name)
    if (patch.shortDescription !== undefined) {
      data.shortDescription = sanitizePlainText(patch.shortDescription)
    }
    if (patch.marketingMarkdown !== undefined) {
      data.marketingMarkdown = sanitizeMarkdown(patch.marketingMarkdown)
    }
    if (patch.marketingFeatures !== undefined) {
      const cleaned = this.sanitizeFeaturesInput(patch.marketingFeatures)
      data.marketingFeatures = cleaned
    }
    if (patch.tierLevel !== undefined) data.tierLevel = patch.tierLevel
    if (patch.xpBonusPercent !== undefined) data.xpBonusPercent = patch.xpBonusPercent
    if (patch.sortOrder !== undefined) data.sortOrder = patch.sortOrder
    if (patch.maxActiveCourses !== undefined) {
      data.maxActiveCourses = patch.maxActiveCourses
    }
    if (patch.isDefaultFree !== undefined) data.isDefaultFree = patch.isDefaultFree
    if (patch.isBestseller !== undefined) data.isBestseller = patch.isBestseller

    if (Object.keys(data).length === 0) {
      const row = await db.plan.findUniqueOrThrow({
        where: { id },
        include: { _count: { select: { users: true } } }
      })
      return this.toRow(row)
    }

    const row = await db.plan.update({
      where: { id },
      data,
      include: { _count: { select: { users: true } } }
    })
    if (patch.isDefaultFree === true) {
      await this.ensureSingleDefaultFree(id)
    }
    return this.toRow(row)
  }

  /** Marks plan as default free; clears flag on all other plans (transactional). */
  async setDefaultFree(planId: string): Promise<AdminPlanRow> {
    await db.$transaction(async tx => {
      await tx.plan.updateMany({ data: { isDefaultFree: false } })
      await tx.plan.update({
        where: { id: planId },
        data: { isDefaultFree: true }
      })
    })
    const row = await db.plan.findUniqueOrThrow({
      where: { id: planId },
      include: { _count: { select: { users: true } } }
    })
    return this.toRow(row)
  }

  /** Highlights one “хит” card on `/plans`; clears flag on all other plans. */
  async setBestseller(planId: string): Promise<AdminPlanRow> {
    await this.ensureSingleBestseller(planId)
    const row = await db.plan.findUniqueOrThrow({
      where: { id: planId },
      include: { _count: { select: { users: true } } }
    })
    return this.toRow(row)
  }

  private normalizeFeatures(raw: Prisma.JsonValue): PlanMarketingBullet[] {
    return parsePlanMarketingBullets(raw)
  }

  private sanitizeFeaturesInput(input: PlanMarketingBullet[] | undefined): PlanMarketingBullet[] {
    const parsed = planMarketingBulletsSchema.parse(input ?? [])
    return parsed.map(b => ({
      iconKey: b.iconKey,
      text: sanitizePlainText(b.text)
    }))
  }

  private async ensureSingleDefaultFree(planId: string): Promise<void> {
    await db.$transaction(async tx => {
      await tx.plan.updateMany({
        where: { id: { not: planId } },
        data: { isDefaultFree: false }
      })
    })
  }

  private async ensureSingleBestseller(planId: string): Promise<void> {
    await db.$transaction(async tx => {
      await tx.plan.updateMany({ data: { isBestseller: false } })
      await tx.plan.update({ where: { id: planId }, data: { isBestseller: true } })
    })
  }

  private toRow(row: {
    id: string
    slug: string
    name: string
    shortDescription: string
    marketingMarkdown: string
    marketingFeatures: Prisma.JsonValue
    isBestseller: boolean
    tierLevel: number
    xpBonusPercent: number
    sortOrder: number
    isDefaultFree: boolean
    maxActiveCourses: number | null
    createdAt: Date
    updatedAt: Date
    _count: { users: number }
  }): AdminPlanRow {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      shortDescription: row.shortDescription,
      marketingMarkdown: row.marketingMarkdown,
      marketingFeatures: this.normalizeFeatures(row.marketingFeatures),
      isBestseller: row.isBestseller,
      tierLevel: row.tierLevel,
      xpBonusPercent: row.xpBonusPercent,
      sortOrder: row.sortOrder,
      isDefaultFree: row.isDefaultFree,
      maxActiveCourses: row.maxActiveCourses,
      userCount: row._count.users,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }
  }
}
