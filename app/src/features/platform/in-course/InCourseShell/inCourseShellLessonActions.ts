import type { Language, LessonDetail } from '~/server/repositories/types'
import { notifications } from '@mantine/notifications'

type Mode = 'run' | 'submit'

export function nextLessonAiNudgeStorageKey(courseSlug: string, lessonId: string): string {
  return `coderoster.aiNextLessonNudgeShown.${courseSlug}.${lessonId}`
}

export interface LessonExecutionDispatchDeps {
  canUseEditor: boolean
  isAuthenticated: boolean
  pushHref: (href: string) => void
  editorLanguage: Language
  solutionVariant: 'draft' | 'improved'
  improvedScratchByLang: Partial<Record<Language, string>>
  improvedCanonicalStr: string
  drafts: Partial<Record<Language, string>>
  lesson: LessonDetail
  courseSlug: string
  setExecutionMode: (mode: Mode) => void
  runMutate: (input: {
    taskId: string
    language: Language
    code: string
    mode: Mode
    context: { kind: 'course'; ref: string }
  }) => void
}

export function dispatchLessonExecution(mode: Mode, d: LessonExecutionDispatchDeps): void {
  if (!d.canUseEditor) {
    notifications.show({
      color: 'yellow',
      message: 'Нужен более высокий тариф для этого урока.'
    })
    return
  }
  if (!d.isAuthenticated) {
    d.pushHref('/login')
    return
  }
  const langForRun = d.editorLanguage
  const improvedPlay =
    d.solutionVariant === 'improved'
      ? (d.improvedScratchByLang[d.editorLanguage] ?? d.improvedCanonicalStr)
      : ''
  const codeForRun =
    d.solutionVariant === 'improved' &&
    typeof improvedPlay === 'string' &&
    improvedPlay.trim().length > 0
      ? improvedPlay
      : (d.drafts[langForRun] ?? d.lesson.starterCodes[langForRun] ?? '')

  d.setExecutionMode(mode)
  d.runMutate({
    taskId: d.lesson.id,
    language: langForRun,
    code: codeForRun,
    mode,
    context: { kind: 'course', ref: d.courseSlug }
  })
}

export interface NextLessonNavigationDeps {
  nudgeStorageKey: string
  courseSlug: string
  pushHref: (href: string) => void
  lesson: LessonDetail
  attemptIsSuccess: boolean
  viewerTier: number
  viewerIsAdmin: boolean
  canUseEditor: boolean
  editorImprovementReady: boolean
  setPopoverOpened: (v: boolean) => void
}

export function handleNextLessonClick(d: NextLessonNavigationDeps): void {
  const nextId = d.lesson.nextLessonId
  if (!nextId) return

  const key = d.nudgeStorageKey
  let nudgeShownBefore = false
  try {
    nudgeShownBefore = globalThis.localStorage.getItem(key) === '1'
  } catch {
    /* ignore */
  }

  const eligibleForNudge =
    d.lesson.kind === 'task' &&
    d.attemptIsSuccess &&
    (d.viewerTier > 0 || d.viewerIsAdmin) &&
    d.canUseEditor &&
    !d.editorImprovementReady

  if (!eligibleForNudge || nudgeShownBefore) {
    d.pushHref(`/learn/${d.courseSlug}/${nextId}`)
    return
  }

  try {
    globalThis.localStorage.setItem(key, '1')
  } catch {
    /* ignore */
  }
  d.setPopoverOpened(true)
}
