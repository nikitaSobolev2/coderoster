import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { LessonDetail } from '~/server/repositories/types'

import { dispatchLessonExecution } from './inCourseShellLessonActions'

const notificationsShow = vi.hoisted(() => vi.fn())

vi.mock('@mantine/notifications', () => ({
  notifications: { show: notificationsShow }
}))

function minimalLesson(overrides: Partial<LessonDetail> = {}): LessonDetail {
  return {
    id: 'lesson-1',
    title: 'T',
    kind: 'task',
    estimatedMinutes: 5,
    isPremium: false,
    minPlanTier: 0,
    courseSlug: 'c',
    courseTitle: 'C',
    moduleId: 'm',
    moduleTitle: 'M',
    order: 0,
    body: '',
    language: 'python',
    allowedLanguages: ['python'],
    starterCodes: { python: 'print(1)' },
    starterCode: 'print(1)',
    tests: [],
    previousLessonId: null,
    nextLessonId: null,
    courseTierRequired: 0,
    requiredPlanTier: 0,
    userCanAccess: true,
    ...overrides
  }
}

describe('dispatchLessonExecution', () => {
  beforeEach(() => {
    notificationsShow.mockClear()
  })

  it('shows tariff notice when editor locked', () => {
    const runMutate = vi.fn()
    dispatchLessonExecution('run', {
      canUseEditor: false,
      isAuthenticated: true,
      pushHref: vi.fn(),
      editorLanguage: 'python',
      solutionVariant: 'draft',
      improvedScratchByLang: {},
      improvedCanonicalStr: '',
      drafts: {},
      lesson: minimalLesson(),
      courseSlug: 'course-a',
      setExecutionMode: vi.fn(),
      runMutate
    })
    expect(notificationsShow).toHaveBeenCalledWith(expect.objectContaining({ color: 'yellow' }))
    expect(runMutate).not.toHaveBeenCalled()
  })

  it('redirects to login when anonymous', () => {
    const pushHref = vi.fn()
    const runMutate = vi.fn()
    dispatchLessonExecution('run', {
      canUseEditor: true,
      isAuthenticated: false,
      pushHref,
      editorLanguage: 'python',
      solutionVariant: 'draft',
      improvedScratchByLang: {},
      improvedCanonicalStr: '',
      drafts: {},
      lesson: minimalLesson(),
      courseSlug: 'course-a',
      setExecutionMode: vi.fn(),
      runMutate
    })
    expect(pushHref).toHaveBeenCalledWith('/login')
    expect(runMutate).not.toHaveBeenCalled()
  })

  it('runs draft code from drafts map', () => {
    const runMutate = vi.fn()
    const setExecutionMode = vi.fn()
    dispatchLessonExecution('submit', {
      canUseEditor: true,
      isAuthenticated: true,
      pushHref: vi.fn(),
      editorLanguage: 'python',
      solutionVariant: 'draft',
      improvedScratchByLang: {},
      improvedCanonicalStr: '',
      drafts: { python: 'print(99)' },
      lesson: minimalLesson(),
      courseSlug: 'course-a',
      setExecutionMode,
      runMutate
    })
    expect(setExecutionMode).toHaveBeenCalledWith('submit')
    expect(runMutate).toHaveBeenCalledWith({
      taskId: 'lesson-1',
      language: 'python',
      code: 'print(99)',
      mode: 'submit',
      context: { kind: 'course', ref: 'course-a' }
    })
  })

  it('prefers improved scratch over canonical when variant improved', () => {
    const runMutate = vi.fn()
    dispatchLessonExecution('run', {
      canUseEditor: true,
      isAuthenticated: true,
      pushHref: vi.fn(),
      editorLanguage: 'python',
      solutionVariant: 'improved',
      improvedScratchByLang: { python: 'print("scratch")' },
      improvedCanonicalStr: 'print("canonical")',
      drafts: { python: 'print("draft")' },
      lesson: minimalLesson(),
      courseSlug: 'course-a',
      setExecutionMode: vi.fn(),
      runMutate
    })
    expect(runMutate).toHaveBeenCalledWith(expect.objectContaining({ code: 'print("scratch")' }))
  })
})
