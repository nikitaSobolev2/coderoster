import { TaskKind } from '@prisma/client'
import { prisma } from '../lib/client'

export interface SeedTest {
  name: string
  input?: string | null
  expected: string
  hidden?: boolean
}

export interface SeedLesson {
  slug: string
  title: string
  starter: string
  /** Markdown: условие + ожидаемый формат вывода */
  body: string
  /** Markdown с рабочим эталоном на Python */
  summary: string
  tests: SeedTest[]
}

export function refPythonBlock(code: string): string {
  return ['```python', code.trim(), '```'].join('\n')
}

export async function syncAutotests(courseTaskId: string, tests: SeedTest[]) {
  await prisma.courseTaskAutotest.deleteMany({ where: { courseTaskId } })
  if (tests.length === 0) return
  await prisma.courseTaskAutotest.createMany({
    data: tests.map((test, index) => ({
      courseTaskId,
      order: index,
      name: test.name,
      input: test.input ?? null,
      expected: test.expected,
      hidden: test.hidden ?? false
    }))
  })
}

const pythonInitialData = (lesson: Pick<SeedLesson, 'slug' | 'starter'>) => ({
  slug: lesson.slug,
  predefinedCode: lesson.starter,
  language: 'python' as const,
  hints: [] as string[]
})

export async function upsertModuleTask(moduleId: string, order: number, lesson: SeedLesson) {
  const task = await prisma.courseTask.upsert({
    where: { moduleId_order: { moduleId, order } },
    update: {
      title: lesson.title,
      summary: lesson.summary,
      description: lesson.body,
      initialData: pythonInitialData(lesson),
      allowedLanguages: ['python']
    },
    create: {
      moduleId,
      title: lesson.title,
      summary: lesson.summary,
      description: lesson.body,
      order,
      kind: TaskKind.TASK,
      estimatedMinutes: 15,
      initialData: pythonInitialData(lesson),
      allowedLanguages: ['python']
    }
  })
  await syncAutotests(task.id, lesson.tests)
  return task
}

export async function upsertDailyTask(dailyChallengeId: string, order: number, lesson: SeedLesson) {
  const task = await prisma.courseTask.upsert({
    where: { dailyChallengeId_order: { dailyChallengeId, order } },
    update: {
      title: lesson.title,
      summary: lesson.summary,
      description: lesson.body,
      initialData: pythonInitialData(lesson),
      allowedLanguages: ['python']
    },
    create: {
      dailyChallengeId,
      title: lesson.title,
      summary: lesson.summary,
      description: lesson.body,
      order,
      kind: TaskKind.TASK,
      estimatedMinutes: 12,
      initialData: pythonInitialData(lesson),
      allowedLanguages: ['python']
    }
  })
  await syncAutotests(task.id, lesson.tests)
  return task
}

export async function upsertWeeklyTask(
  weeklyChallengeId: string,
  order: number,
  lesson: SeedLesson
) {
  const task = await prisma.courseTask.upsert({
    where: { weeklyChallengeId_order: { weeklyChallengeId, order } },
    update: {
      title: lesson.title,
      summary: lesson.summary,
      description: lesson.body,
      initialData: pythonInitialData(lesson),
      allowedLanguages: ['python']
    },
    create: {
      weeklyChallengeId,
      title: lesson.title,
      summary: lesson.summary,
      description: lesson.body,
      order,
      kind: TaskKind.TASK,
      estimatedMinutes: 15,
      initialData: pythonInitialData(lesson),
      allowedLanguages: ['python']
    }
  })
  await syncAutotests(task.id, lesson.tests)
  return task
}
