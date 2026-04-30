import { z } from 'zod'

/** Keys mapped to solid FA icons on the client. Keep in sync with `PlanBulletIcon`. */
export const PLAN_MARKETING_BULLET_ICON_KEYS = [
  'check',
  'star',
  'bolt',
  'sparkles',
  'wand',
  'code',
  'shield',
  'rocket',
  'gift',
  'infinity'
] as const

export type PlanMarketingBulletIconKey = (typeof PLAN_MARKETING_BULLET_ICON_KEYS)[number]

export const planMarketingBulletIconKeySchema = z.enum(PLAN_MARKETING_BULLET_ICON_KEYS)

export const planMarketingBulletSchema = z
  .object({
    iconKey: z.string().optional(),
    text: z.string().min(1).max(400)
  })
  .transform(({ iconKey, text }) => ({
    iconKey: (planMarketingBulletIconKeySchema.safeParse(iconKey).success
      ? iconKey
      : 'check') as PlanMarketingBulletIconKey,
    text
  }))

export const planMarketingBulletsSchema = z.array(planMarketingBulletSchema).max(24)

export type PlanMarketingBullet = z.infer<typeof planMarketingBulletSchema>

export function parsePlanMarketingBullets(raw: unknown): PlanMarketingBullet[] {
  const r = planMarketingBulletsSchema.safeParse(raw)
  if (!r.success) return []
  return r.data
}
