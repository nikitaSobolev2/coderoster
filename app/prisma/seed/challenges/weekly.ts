import { prisma } from '../lib/client'
import { upsertWeeklyTask } from '../catalog/taskFactory'
import { allWeeklyLessonGroups, WEEK_ISO_KEYS } from './challengeContent'

export async function seedWeeklyChallenges(): Promise<void> {
  const groups = allWeeklyLessonGroups()
  for (let i = 0; i < WEEK_ISO_KEYS.length; i++) {
    const isoWeek = WEEK_ISO_KEYS[i]!
    const had = await prisma.weeklyChallenge.findUnique({ where: { isoWeek } })
    if (had) {
      await prisma.weeklyChallenge.delete({ where: { isoWeek } })
    }
    const challenge = await prisma.weeklyChallenge.create({ data: { isoWeek } })
    const lessons = groups[i]!
    for (let j = 0; j < lessons.length; j++) {
      await upsertWeeklyTask(challenge.id, j + 1, lessons[j]!)
    }
  }
}
