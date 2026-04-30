import 'server-only'
import type { Prisma, PrismaClient } from '@prisma/client'
import { db } from '~/server/db'
import { requiredTierForTask } from '~/shared/lib/planTier'

type Tx = Prisma.TransactionClient | PrismaClient

export class PlanService {
  async getEffectiveTier(userId: string, tx: Tx = db): Promise<number> {
    const row = await tx.user.findUnique({
      where: { id: userId },
      select: { plan: { select: { tierLevel: true } } }
    })
    return row?.plan?.tierLevel ?? 0
  }

  async countActiveEnrollments(userId: string, tx: Tx = db): Promise<number> {
    return tx.enrollment.count({
      where: { userId, status: 'ACTIVE' }
    })
  }

  async assertCanStartOrResumeEnrollment(
    userId: string,
    courseId: string,
    tx: Tx = db
  ): Promise<void> {
    const course = await tx.course.findUnique({
      where: { id: courseId },
      select: { tierRequired: true }
    })
    if (!course) throw new Error('COURSE_NOT_FOUND')
    const tier = await this.getEffectiveTier(userId, tx)
    if (tier < course.tierRequired) throw new Error('PLAN_TIER_TOO_LOW')

    const existing = await tx.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { status: true }
    })
    if (existing?.status === 'ACTIVE') return

    const cap = await this.resolveEnrollmentCap(userId, tx)
    if (cap === null) return
    const activeCount = await this.countActiveEnrollments(userId, tx)
    if (activeCount >= cap) throw new Error('ACTIVE_ENROLLMENT_CAP')
  }

  async canEnrollCourse(userId: string, courseId: string, tx: Tx = db): Promise<boolean> {
    const [tier, course] = await Promise.all([
      this.getEffectiveTier(userId, tx),
      tx.course.findUnique({
        where: { id: courseId },
        select: { tierRequired: true }
      })
    ])
    if (!course) return false
    return tier >= course.tierRequired
  }

  async resolveEnrollmentCap(userId: string, tx: Tx = db): Promise<number | null> {
    const row = await tx.user.findUnique({
      where: { id: userId },
      select: { plan: { select: { maxActiveCourses: true } } }
    })
    return row?.plan?.maxActiveCourses ?? null
  }

  async canAccessTask(userId: string, taskId: string, tx: Tx = db): Promise<boolean> {
    const task = await tx.courseTask.findUnique({
      where: { id: taskId },
      include: { module: { include: { course: true } } }
    })
    if (!task?.module?.course) return false
    const tier = await this.getEffectiveTier(userId, tx)
    const need = requiredTierForTask(task.module.course.tierRequired, {
      isPremium: task.isPremium,
      minPlanTier: task.minPlanTier
    })
    return tier >= need
  }

  /** First module-ordered task the user may open (tier gates). */
  async findFirstAccessibleLessonId(
    courseId: string,
    userId: string,
    tx: Tx = db
  ): Promise<string | null> {
    const tier = await this.getEffectiveTier(userId, tx)
    const course = await tx.course.findUnique({
      where: { id: courseId },
      select: { tierRequired: true }
    })
    if (!course) return null
    const modules = await tx.courseModule.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: { tasks: { orderBy: { order: 'asc' } } }
    })
    for (const mod of modules) {
      for (const task of mod.tasks) {
        const need = requiredTierForTask(course.tierRequired, {
          isPremium: task.isPremium,
          minPlanTier: task.minPlanTier
        })
        if (tier >= need) return task.id
      }
    }
    return null
  }

  /**
   * Next accessible lesson after `completedTaskId` in module/task order, or `null` if none.
   */
  async findNextAccessibleLessonIdAfterTask(
    courseId: string,
    userId: string,
    completedTaskId: string,
    tx: Tx = db
  ): Promise<string | null> {
    const tier = await this.getEffectiveTier(userId, tx)
    const course = await tx.course.findUnique({
      where: { id: courseId },
      select: { tierRequired: true }
    })
    if (!course) return null
    const modules = await tx.courseModule.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: { tasks: { orderBy: { order: 'asc' } } }
    })
    let passedCompleted = false
    for (const mod of modules) {
      for (const task of mod.tasks) {
        if (!passedCompleted) {
          if (task.id === completedTaskId) passedCompleted = true
          continue
        }
        const need = requiredTierForTask(course.tierRequired, {
          isPremium: task.isPremium,
          minPlanTier: task.minPlanTier
        })
        if (tier >= need) return task.id
      }
    }
    return null
  }
}

export const planService = new PlanService()
