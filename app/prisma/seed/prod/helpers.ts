import { TaskKind } from '@prisma/client'
import { refPythonBlock, type SeedLesson, type SeedTest } from '../catalog/taskFactory'

/** Задача с двумя стартерами (Python + PHP), описание по секциям RU. */
export function bi(
  slug: string,
  title: string,
  taskDescription: string,
  outputFormat: string,
  pyStarter: string,
  phpStarter: string,
  referencePython: string,
  tests: SeedTest[],
  opts?: { isPremium?: boolean; minPlanTier?: number; estimatedMinutes?: number }
): SeedLesson {
  return {
    slug,
    title,
    taskDescription,
    outputFormat,
    starterCodes: { python: pyStarter, php: phpStarter },
    summary: refPythonBlock(referencePython),
    tests,
    kind: TaskKind.TASK,
    isPremium: opts?.isPremium ?? false,
    minPlanTier: opts?.minPlanTier ?? 1,
    estimatedMinutes: opts?.estimatedMinutes
  }
}

/** Теория без автотестов (прогресс через «Отметить пройденным»). */
export function theoryRU(slug: string, title: string, body: string): SeedLesson {
  return {
    slug,
    title,
    body,
    summary: '_Теория: ознакомься с материалом и отметь урок пройденным._',
    starterCodes: {
      python: '# Ознакомься с текстом задания слева. Затем отметь урок пройденным в интерфейсе.\n',
      php: '<?php\n// Ознакомься с текстом задания слева.\n'
    },
    tests: [],
    kind: TaskKind.THEORY,
    estimatedMinutes: 10,
    isPremium: false,
    minPlanTier: 1
  }
}

export const tt = (name: string, expected: string, input?: string | null): SeedTest => ({
  name,
  expected,
  input: input ?? null
})
