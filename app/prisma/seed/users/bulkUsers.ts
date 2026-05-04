import { AchievementStatus, AttemptStatus, EnrollmentStatus, Role } from '@prisma/client'
import { levelForActivityCount } from '../../../src/server/lib/activityHeatmapLevel'
import type { SeedCourseMeta } from '../catalog/seedCourses'
import { prisma } from '../lib/client'
import { seedEmail } from '../lib/seedUser'

const BULK_COUNT = 100

const FIRST_NAMES = [
  'Алексей',
  'Мария',
  'Дмитрий',
  'Елена',
  'Иван',
  'Ольга',
  'Сергей',
  'Анна',
  'Павел',
  'Наталья',
  'Кирилл',
  'Татьяна',
  'Виктор',
  'София',
  'Михаил',
  'Юлия',
  'Андрей',
  'Екатерина',
  'Никита',
  'Дарья',
  'Роман',
  'Полина',
  'Глеб',
  'Алиса',
  'Семён',
  'Максим',
  'Варвара',
  'Денис',
  'Любовь',
  'Артём'
] as const

const LAST_NAMES = [
  'Иванов',
  'Петрова',
  'Сидоров',
  'Кузнецова',
  'Смирнов',
  'Морозова',
  'Волков',
  'Павлова',
  'Соколов',
  'Лебедева',
  'Козлов',
  'Новикова',
  'Орлов',
  'Фёдорова',
  'Захаров',
  'Васильева',
  'Николаев',
  'Семёнова',
  'Поляков',
  'Михайлова',
  'Александров',
  'Егорова',
  'Борисов',
  'Маркова',
  'Григорьев',
  'Тихонова',
  'Соловьёв',
  'Романова',
  'Зайцев',
  'Денисова'
] as const

function addDaysIso(ymd: string, days: number): string {
  const t = Date.parse(`${ymd}T00:00:00.000Z`) + days * 86_400_000
  return new Date(t).toISOString().slice(0, 10)
}

function displayNameFor(i: number): string {
  const fn = FIRST_NAMES[i % FIRST_NAMES.length]
  const ln = LAST_NAMES[(i * 7) % LAST_NAMES.length]
  return `${fn} ${ln}`
}

export interface SeedDemoLearnersOptions {
  workosIdPrefix: string
  usernamePrefix: string
  count: number
  /** Default free plan — enrollments / leaderboard realism for prod demo. */
  planId?: string | null
  heatmapAnchor?: string
  heatmapSpanDays?: number
  /** Key stored on `lesson.passed` activity payload (value = learner index). */
  lessonActivityPayloadKey?: string
  bioLine?: (index: number) => string
}

/**
 * Synthetic learners: enrollments, task attempts, achievements, heatmap snapshots, sporadic activity.
 * Idempotent per cohort via `deleteMany` on `workosIdPrefix`.
 */
export async function seedDemoLearnersForCourses(
  courses: SeedCourseMeta[],
  options: SeedDemoLearnersOptions
): Promise<void> {
  if (courses.length === 0) {
    console.warn('[seed] seedDemoLearnersForCourses: no courses, skip')
    return
  }

  const {
    workosIdPrefix,
    usernamePrefix,
    count,
    planId,
    heatmapAnchor = '2026-01-01',
    heatmapSpanDays = 50,
    lessonActivityPayloadKey = 'seedBulk',
    bioLine = i => `Сид-пользователь №${i}. Практикую Python и алгоритмы.`
  } = options

  const achievements = await prisma.achievement.findMany({
    select: { id: true, slug: true, goal: true }
  })

  await prisma.user.deleteMany({
    where: { workosUserId: { startsWith: workosIdPrefix } }
  })

  for (let i = 1; i <= count; i++) {
    const workosUserId = `${workosIdPrefix}${i}`
    const username = `${usernamePrefix}${String(i).padStart(3, '0')}`
    const email = seedEmail(username)
    const displayName = displayNameFor(i)

    const occupant = await prisma.user.findUnique({ where: { username } })
    if (occupant && occupant.workosUserId !== workosUserId) {
      console.warn(`[seed] skip demo learner ${i}: username ${username} owned by another id`)
      continue
    }

    const totalXp = (i * 941 + 17) % 200_000
    const streakDays = i % 28
    const lastActiveDay = addDaysIso('2026-01-01', (i % 120) + 1)

    const user = await prisma.user.create({
      data: {
        workosUserId,
        username,
        email,
        displayName,
        bio: bioLine(i),
        role: Role.LEARNER,
        totalXp,
        streakDays,
        lastActiveDay,
        ...(planId != null && planId !== '' ? { planId } : {})
      }
    })

    const nCourses = 1 + (i % 4)
    const startIdx = i % courses.length
    for (let c = 0; c < nCourses; c++) {
      const meta = courses[(startIdx + c) % courses.length]!
      const totalTasks = meta.taskIdsInOrder.length
      const doneN =
        totalTasks === 0
          ? 0
          : Math.min(totalTasks, ((i + c * 3) % totalTasks) + Math.min(2, totalTasks))
      const completedIds = meta.taskIdsInOrder.slice(0, doneN)
      const pct = totalTasks === 0 ? 0 : Math.round((doneN / totalTasks) * 100)
      const finished = pct >= 100

      await prisma.enrollment.upsert({
        where: { userId_courseId: { userId: user.id, courseId: meta.id } },
        update: {
          progressPercent: pct,
          completedLessonIds: completedIds,
          status: finished ? EnrollmentStatus.FINISHED : EnrollmentStatus.ACTIVE,
          finishedAt: finished ? new Date() : null
        },
        create: {
          userId: user.id,
          courseId: meta.id,
          progressPercent: pct,
          completedLessonIds: completedIds,
          status: finished ? EnrollmentStatus.FINISHED : EnrollmentStatus.ACTIVE,
          finishedAt: finished ? new Date() : null
        }
      })

      for (const taskId of completedIds) {
        await prisma.courseTaskAttempt.upsert({
          where: {
            courseTaskId_userId: { courseTaskId: taskId, userId: user.id }
          },
          update: { status: AttemptStatus.SUCCESS, tryN: 1 },
          create: {
            courseTaskId: taskId,
            userId: user.id,
            status: AttemptStatus.SUCCESS,
            tryN: 1
          }
        })
      }
    }

    const nAch = 2 + (i % 3)
    for (let a = 0; a < nAch; a++) {
      const ach = achievements[(i + a * 5) % achievements.length]
      if (!ach) continue
      const goal = ach.goal ?? 1
      await prisma.userAchievementTrack.upsert({
        where: {
          userId_achievementId: { userId: user.id, achievementId: ach.id }
        },
        update: {
          status: AchievementStatus.SUCCESS,
          currentN: goal,
          earnedAt: new Date()
        },
        create: {
          userId: user.id,
          achievementId: ach.id,
          status: AchievementStatus.SUCCESS,
          currentN: goal,
          earnedAt: new Date()
        }
      })
    }

    for (let d = 0; d < heatmapSpanDays; d++) {
      if ((i + d) % 2 === 0) {
        continue
      }
      const date = addDaysIso(heatmapAnchor, d)
      const activityCount = ((i * 3 + d) % 8) + 1
      const level = levelForActivityCount(activityCount)
      await prisma.userActivitySnapshot.upsert({
        where: { userId_date: { userId: user.id, date } },
        update: { count: activityCount, level },
        create: { userId: user.id, date, count: activityCount, level }
      })
    }

    if (i % 4 === 0) {
      await prisma.userActivity.create({
        data: {
          userId: user.id,
          type: 'lesson.passed',
          payload: { [lessonActivityPayloadKey]: i }
        }
      })
    }
  }
}

export async function seedBulkUsers(courses: SeedCourseMeta[]): Promise<void> {
  await seedDemoLearnersForCourses(courses, {
    workosIdPrefix: 'seed-bulk-',
    usernamePrefix: 'seedbulk',
    count: BULK_COUNT
  })
}
