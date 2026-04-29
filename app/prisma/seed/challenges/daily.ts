import { prisma } from '../lib/client'
import { upsertDailyTask } from '../catalog/taskFactory'
import { allDailyLessonGroups, DAILY_DATES } from './challengeContent'

export async function seedDailyChallenges(): Promise<void> {
  const groups = allDailyLessonGroups()
  for (let i = 0; i < DAILY_DATES.length; i++) {
    const date = DAILY_DATES[i]!
    const had = await prisma.dailyChallenge.findUnique({ where: { date } })
    if (had) {
      await prisma.dailyChallenge.delete({ where: { date } })
    }
    const challenge = await prisma.dailyChallenge.create({ data: { date } })
    const lessons = groups[i]!
    for (let j = 0; j < lessons.length; j++) {
      await upsertDailyTask(challenge.id, j + 1, lessons[j]!)
    }
  }
}
