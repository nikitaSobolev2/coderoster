import type { Dispatch, SetStateAction } from 'react'
import type { LessonDetail, RunResult } from '~/server/repositories/types'

import type { ExecutionState } from '../ExecutionPanel'
import type { TaskPaneTab } from '../TaskPane'

import type { SolutionVariantGate } from './inCourseShellSolutionVariant'

export type { SolutionVariantGate } from './inCourseShellSolutionVariant'

/**
 * Parameter bag for the three TRPC slices composed in `InCourseShell` (`index.tsx`).
 * Keeping hook calls in the page avoids ESLint losing `createTRPCReact` types on a nested composer hook.
 */
export interface UseInCourseShellTrpcParams {
  lesson: LessonDetail
  viewerIsAdmin: boolean
  aiJobId: string | null
  setAiJobId: Dispatch<SetStateAction<string | null>>
  executionId: string | null
  setExecutionId: Dispatch<SetStateAction<string | null>>
  executionState: ExecutionState
  setExecutionState: Dispatch<SetStateAction<ExecutionState>>
  setExecutionError: Dispatch<SetStateAction<string | null>>
  setExecutionResult: Dispatch<SetStateAction<RunResult | null>>
  setSolutionVariant: Dispatch<SetStateAction<SolutionVariantGate>>
  setLeftPaneTab: Dispatch<SetStateAction<TaskPaneTab>>
  setCompletedLessonIds: Dispatch<SetStateAction<string[]>>
}
