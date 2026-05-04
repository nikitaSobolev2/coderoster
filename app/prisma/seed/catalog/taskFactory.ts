import { TaskKind } from '@prisma/client'
import type { Prisma } from '@prisma/client'
import { prisma } from '../lib/client'
import { buildLessonBody } from './lessonMarkdown'
import type { CoursePrimaryLanguage } from './courseTypes'

export interface SeedTest {
  name: string
  input?: string | null
  expected: string
  hidden?: boolean
}

export interface SeedLesson {
  slug: string
  title: string
  /** Markdown к эталону на Python (подсказка после задачи). */
  summary: string
  tests: SeedTest[]
  /** Полное условие в Markdown (legacy dev seed). */
  body?: string
  /** Если заданы оба — тело собирается через `buildLessonBody`. */
  taskDescription?: string
  outputFormat?: string
  /** Legacy: только Python. */
  starter?: string
  starterCodes?: Partial<Record<'python' | 'php', string>>
  kind?: TaskKind
  isPremium?: boolean
  minPlanTier?: number
  estimatedMinutes?: number
}

export function refPythonBlock(code: string): string {
  return ['```python', code.trim(), '```'].join('\n')
}

export function resolveLessonBody(lesson: SeedLesson): string {
  if (lesson.body) return lesson.body
  if (lesson.taskDescription != null && lesson.outputFormat != null) {
    return buildLessonBody(lesson.taskDescription, lesson.outputFormat)
  }
  throw new Error(`[seed] lesson "${lesson.slug}": нужно body или taskDescription+outputFormat`)
}

export function resolveStarterPack(
  lesson: SeedLesson,
  primary: CoursePrimaryLanguage
): {
  starterCodes: Record<string, string>
  predefinedCode: string
  allowedLanguages: string[]
} {
  const kind = lesson.kind ?? TaskKind.TASK
  const python = lesson.starterCodes?.python ?? lesson.starter
  const php = lesson.starterCodes?.php

  if (kind === TaskKind.THEORY) {
    const py = python ?? '# Прочитай материал.\n'
    const ph = php ?? '<?php\n// Прочитай материал.\n'
    return {
      starterCodes: { python: py, php: ph },
      predefinedCode: primary === 'php' ? ph : py,
      allowedLanguages: ['python', 'php']
    }
  }

  const starterCodes: Record<string, string> = {}
  if (python) starterCodes.python = python
  if (php) starterCodes.php = php

  if (Object.keys(starterCodes).length === 0) {
    throw new Error(`[seed] lesson "${lesson.slug}": нет starter / starterCodes`)
  }

  const allowedLanguages = (['python', 'php'] as const).filter(
    l => typeof starterCodes[l] === 'string'
  )
  const predefinedCode = starterCodes[primary] ?? starterCodes.python ?? starterCodes.php ?? ''

  return { starterCodes, predefinedCode, allowedLanguages }
}

function buildInitialData(
  lesson: SeedLesson,
  primary: CoursePrimaryLanguage,
  pack: ReturnType<typeof resolveStarterPack>
): Prisma.InputJsonValue {
  return {
    slug: lesson.slug,
    predefinedCode: pack.predefinedCode,
    language: primary,
    hints: [] as string[],
    starterCodes: pack.starterCodes
  } as Prisma.InputJsonValue
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

export async function upsertModuleTask(
  moduleId: string,
  order: number,
  lesson: SeedLesson,
  coursePrimaryLanguage: CoursePrimaryLanguage = 'python'
) {
  const kind = lesson.kind ?? TaskKind.TASK
  const description = resolveLessonBody(lesson)
  const pack = resolveStarterPack(lesson, coursePrimaryLanguage)
  const estimatedMinutes = lesson.estimatedMinutes ?? (kind === TaskKind.THEORY ? 12 : 15)

  const task = await prisma.courseTask.upsert({
    where: { moduleId_order: { moduleId, order } },
    update: {
      title: lesson.title,
      summary: lesson.summary,
      description,
      initialData: buildInitialData(lesson, coursePrimaryLanguage, pack),
      allowedLanguages: pack.allowedLanguages,
      kind,
      estimatedMinutes,
      isPremium: lesson.isPremium ?? false,
      minPlanTier: lesson.minPlanTier ?? 1
    },
    create: {
      moduleId,
      title: lesson.title,
      summary: lesson.summary,
      description,
      order,
      kind,
      estimatedMinutes,
      initialData: buildInitialData(lesson, coursePrimaryLanguage, pack),
      allowedLanguages: pack.allowedLanguages,
      isPremium: lesson.isPremium ?? false,
      minPlanTier: lesson.minPlanTier ?? 1
    }
  })
  await syncAutotests(task.id, lesson.tests)
  return task
}

export async function upsertDailyTask(dailyChallengeId: string, order: number, lesson: SeedLesson) {
  const primary: CoursePrimaryLanguage = 'python'
  const kind = lesson.kind ?? TaskKind.TASK
  const description = resolveLessonBody(lesson)
  const pack = resolveStarterPack(lesson, primary)
  const task = await prisma.courseTask.upsert({
    where: { dailyChallengeId_order: { dailyChallengeId, order } },
    update: {
      title: lesson.title,
      summary: lesson.summary,
      description,
      initialData: buildInitialData(lesson, primary, pack),
      allowedLanguages: pack.allowedLanguages,
      kind,
      isPremium: lesson.isPremium ?? false,
      minPlanTier: lesson.minPlanTier ?? 1
    },
    create: {
      dailyChallengeId,
      title: lesson.title,
      summary: lesson.summary,
      description,
      order,
      kind,
      estimatedMinutes: lesson.estimatedMinutes ?? 12,
      initialData: buildInitialData(lesson, primary, pack),
      allowedLanguages: pack.allowedLanguages,
      isPremium: lesson.isPremium ?? false,
      minPlanTier: lesson.minPlanTier ?? 1
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
  const primary: CoursePrimaryLanguage = 'python'
  const kind = lesson.kind ?? TaskKind.TASK
  const description = resolveLessonBody(lesson)
  const pack = resolveStarterPack(lesson, primary)
  const task = await prisma.courseTask.upsert({
    where: { weeklyChallengeId_order: { weeklyChallengeId, order } },
    update: {
      title: lesson.title,
      summary: lesson.summary,
      description,
      initialData: buildInitialData(lesson, primary, pack),
      allowedLanguages: pack.allowedLanguages,
      kind,
      isPremium: lesson.isPremium ?? false,
      minPlanTier: lesson.minPlanTier ?? 1
    },
    create: {
      weeklyChallengeId,
      title: lesson.title,
      summary: lesson.summary,
      description,
      order,
      kind,
      estimatedMinutes: lesson.estimatedMinutes ?? 15,
      initialData: buildInitialData(lesson, primary, pack),
      allowedLanguages: pack.allowedLanguages,
      isPremium: lesson.isPremium ?? false,
      minPlanTier: lesson.minPlanTier ?? 1
    }
  })
  await syncAutotests(task.id, lesson.tests)
  return task
}
