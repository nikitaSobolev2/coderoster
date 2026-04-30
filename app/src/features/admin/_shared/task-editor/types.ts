import type { TaskKind } from '@prisma/client'

/**
 * Shape consumed by the shared `TaskEditor` view. Both course-bound tasks
 * (under a module) and challenge-bound tasks (under a daily/weekly) flatten
 * to this structure so the same form drives both surfaces.
 */
export interface EditableTask {
  id: string
  title: string
  summary: string
  description: string
  kind: TaskKind
  estimatedMinutes: number
  allowedLanguages: string[]
  initialData: Record<string, unknown>
  result: Record<string, unknown> | null
  isPremium: boolean
  minPlanTier: number
  autotests: EditableAutotest[]
}

export interface EditableAutotest {
  id: string
  order: number
  name: string
  input: string | null
  expected: string
  hidden: boolean
}

export interface TaskUpdatePatch {
  title?: string
  summary?: string
  description?: string
  kind?: TaskKind
  estimatedMinutes?: number
  allowedLanguages?: string[]
  initialData?: Record<string, unknown>
  result?: Record<string, unknown> | null
  isPremium?: boolean
  minPlanTier?: number
}

export interface AutotestPatch {
  name?: string
  input?: string | null
  expected?: string
  hidden?: boolean
}

/**
 * Plain-function dispatch surface so the shared editor stays decoupled from
 * any specific tRPC router. Wrappers wire these to `useMutation().mutateAsync`.
 */
export interface TaskEditorMutations {
  updateTask: (input: { taskId: string; patch: TaskUpdatePatch }) => Promise<void>
  createAutotest: (input: {
    taskId: string
    name: string
    input?: string | null
    expected: string
    hidden?: boolean
  }) => Promise<void>
  updateAutotest: (input: { autotestId: string; patch: AutotestPatch }) => Promise<void>
  deleteAutotest: (input: { autotestId: string }) => Promise<void>
  reorderAutotests: (input: { taskId: string; orderedIds: string[] }) => Promise<void>
  isUpdatingTask: boolean
}
