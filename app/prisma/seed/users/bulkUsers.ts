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

export async function seedBulkUsers(courses: SeedCourseMeta[]): Promise<void> {
  const achievements = await prisma.achievement.findMany({
    select: { id: true, slug: true, goal: true }
  })

  await prisma.user.deleteMany({
    where: { workosUserId: { startsWith: 'seed-bulk-' } }
  })

  for (let i = 1; i <= BULK_COUNT; i++) {
    const workosUserId = `seed-bulk-${i}`
    const username = `seedbulk${String(i).padStart(3, '0')}`
    const email = seedEmail(username)
    const displayName = displayNameFor(i)

    const occupant = await prisma.user.findUnique({ where: { username } })
    if (occupant && occupant.workosUserId !== workosUserId) {
      console.warn(`[seed] skip bulk user ${i}: username ${username} owned by another id`)
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
        bio: `Сид-пользователь №${i}. Практикую Python и алгоритмы.`,
        role: Role.LEARNER,
        totalXp,
        streakDays,
        lastActiveDay
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

    for (let d = 0; d < 50; d++) {
      if ((i + d) % 2 === 0) {
        continue
      }
      const date = addDaysIso('2026-01-01', d)
      const count = ((i * 3 + d) % 8) + 1
      const level = levelForActivityCount(count)
      await prisma.userActivitySnapshot.upsert({
        where: { userId_date: { userId: user.id, date } },
        update: { count, level },
        create: { userId: user.id, date, count, level }
      })
    }

    if (i % 4 === 0) {
      await prisma.userActivity.create({
        data: {
          userId: user.id,
          type: 'lesson.passed',
          payload: { seedBulk: i }
        }
      })
    }
  }
}
