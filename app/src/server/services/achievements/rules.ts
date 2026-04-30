import 'server-only'
import type { Prisma, PrismaClient } from '@prisma/client'

type Tx = Prisma.TransactionClient | PrismaClient

/** Trigger fired by domain events. New triggers can be added without touching existing rules. */
export type AchievementTrigger =
  | 'lesson.passed'
  | 'lesson.completed'
  | 'course.finished'
  | 'streak.tick'
  | 'daily.cleared'
  | 'weekly.cleared'
  | 'execution.completed'
  | 'plan.assigned'

export interface RuleContext {
  userId: string
  trigger: AchievementTrigger
  payload: Record<string, unknown>
  tx: Tx
}

export interface RuleEvaluation {
  /** Absolute progress for this user against this rule's goal. */
  currentN: number
  /** Whether the goal is satisfied this evaluation. */
  satisfied: boolean
  /** Optional override for goal — falls back to `Achievement.goal` when omitted. */
  goal?: number
}

export interface AchievementRule {
  slug: string
  triggers: AchievementTrigger[]
  evaluate(context: RuleContext): Promise<RuleEvaluation>
}

const SECOND_HALF_OF_NIGHT_HOURS = new Set([0, 1, 2, 3])

const firstSteps: AchievementRule = {
  slug: 'first-steps',
  triggers: ['lesson.passed'],
  async evaluate({ userId, tx }) {
    const passed = await tx.courseTaskAttempt.count({ where: { userId, status: 'SUCCESS' } })
    return { currentN: passed, satisfied: passed >= 1, goal: 1 }
  }
}

const onFire: AchievementRule = {
  slug: 'on-fire',
  triggers: ['streak.tick', 'lesson.passed'],
  async evaluate({ userId, tx }) {
    const user = await tx.user.findUnique({ where: { id: userId }, select: { streakDays: true } })
    const days = user?.streakDays ?? 0
    return { currentN: days, satisfied: days >= 7, goal: 7 }
  }
}

const allClear: AchievementRule = {
  slug: 'all-clear',
  triggers: ['course.finished', 'lesson.passed'],
  async evaluate({ userId, tx }) {
    const finished = await tx.enrollment.count({ where: { userId, status: 'FINISHED' } })
    return { currentN: finished, satisfied: finished >= 1, goal: 1 }
  }
}

const speedCoder: AchievementRule = {
  slug: 'speed-coder',
  triggers: ['execution.completed'],
  async evaluate({ payload }) {
    const runtimeMs =
      typeof payload.runtimeMs === 'number' ? payload.runtimeMs : Number.MAX_SAFE_INTEGER
    const passed = Boolean(payload.passed)
    const satisfied = passed && runtimeMs > 0 && runtimeMs < 60_000
    return { currentN: satisfied ? 1 : 0, satisfied, goal: 1 }
  }
}

const nightOwl: AchievementRule = {
  slug: 'night-owl',
  triggers: ['lesson.passed', 'daily.cleared'],
  async evaluate({ payload }) {
    const at = payload.at instanceof Date ? payload.at : new Date()
    const hour = at.getUTCHours()
    const satisfied = SECOND_HALF_OF_NIGHT_HOURS.has(hour)
    return { currentN: satisfied ? 1 : 0, satisfied, goal: 1 }
  }
}

const polyglot: AchievementRule = {
  slug: 'polyglot',
  triggers: ['lesson.passed'],
  async evaluate({ userId, tx }) {
    const langs = await tx.execution.findMany({
      where: { userId, passed: true },
      select: { language: true },
      distinct: ['language']
    })
    const distinct = new Set(langs.map(row => row.language))
    return {
      currentN: distinct.size,
      satisfied: distinct.has('python') && distinct.has('php'),
      goal: 2
    }
  }
}

const marathon: AchievementRule = {
  slug: 'marathon',
  triggers: ['lesson.passed'],
  async evaluate({ userId, tx, payload }) {
    const at = payload.at instanceof Date ? payload.at : new Date()
    const dayStart = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()))
    const dayEnd = new Date(dayStart.getTime() + 86_400_000)
    const todays = await tx.userActivity.count({
      where: {
        userId,
        type: 'lesson.passed',
        createdAt: { gte: dayStart, lt: dayEnd }
      }
    })
    return { currentN: todays, satisfied: todays >= 10, goal: 10 }
  }
}

const dailyGrinder: AchievementRule = {
  slug: 'daily-grinder',
  triggers: ['daily.cleared'],
  async evaluate({ userId, tx }) {
    const cleared = await tx.dailyChallengeAttempt.count({
      where: { userId, status: 'SUCCESS' }
    })
    return { currentN: cleared, satisfied: cleared >= 7, goal: 7 }
  }
}

const weeklyChampion: AchievementRule = {
  slug: 'weekly-champion',
  triggers: ['weekly.cleared'],
  async evaluate({ userId, tx }) {
    const cleared = await tx.weeklyChallengeAttempt.count({
      where: { userId, status: 'SUCCESS' }
    })
    return { currentN: cleared, satisfied: cleared >= 1, goal: 1 }
  }
}

const comeback: AchievementRule = {
  slug: 'comeback',
  triggers: ['lesson.passed', 'daily.cleared'],
  async evaluate({ userId, tx, payload }) {
    const at = payload.at instanceof Date ? payload.at : new Date()
    const sevenDaysAgo = new Date(at.getTime() - 7 * 86_400_000)
    const previous = await tx.userActivity.findFirst({
      where: { userId, createdAt: { lt: at } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    })
    if (!previous) return { currentN: 0, satisfied: false, goal: 1 }
    const gap = at.getTime() - previous.createdAt.getTime()
    const satisfied = previous.createdAt < sevenDaysAgo && gap >= 7 * 86_400_000
    return { currentN: satisfied ? 1 : 0, satisfied, goal: 1 }
  }
}

const premiumMember: AchievementRule = {
  slug: 'premium-member',
  triggers: ['plan.assigned'],
  async evaluate({ payload }) {
    const tierLevel = typeof payload.tierLevel === 'number' ? payload.tierLevel : 0
    const satisfied = tierLevel > 0
    return { currentN: satisfied ? 1 : 0, satisfied, goal: 1 }
  }
}

const ALL_RULES: AchievementRule[] = [
  firstSteps,
  onFire,
  allClear,
  speedCoder,
  nightOwl,
  polyglot,
  marathon,
  dailyGrinder,
  weeklyChampion,
  comeback,
  premiumMember
]

export class AchievementRuleRegistry {
  private readonly bySlug = new Map<string, AchievementRule>()
  private readonly byTrigger = new Map<AchievementTrigger, AchievementRule[]>()

  constructor(rules: AchievementRule[]) {
    for (const rule of rules) {
      this.bySlug.set(rule.slug, rule)
      for (const trigger of rule.triggers) {
        const existing = this.byTrigger.get(trigger) ?? []
        existing.push(rule)
        this.byTrigger.set(trigger, existing)
      }
    }
  }

  rulesFor(trigger: AchievementTrigger): AchievementRule[] {
    return this.byTrigger.get(trigger) ?? []
  }

  rule(slug: string): AchievementRule | null {
    return this.bySlug.get(slug) ?? null
  }

  allSlugs(): string[] {
    return [...this.bySlug.keys()]
  }
}

export const achievementRuleRegistry = new AchievementRuleRegistry(ALL_RULES)
