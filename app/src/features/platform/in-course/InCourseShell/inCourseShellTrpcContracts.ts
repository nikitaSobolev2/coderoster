import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'

import type { LatestRowLike, LiveAiJobLike } from './inCourseShellWorkspaceShapes'

/** Mirrors `execution.run` input — kept literal so ESLint does not choke on `inferRouterInputs<AppRouter>`. */
export type ExecutionRunMutationInput = {
  language: 'python' | 'php'
  code: string
  taskId?: string | null
  mode?: 'run' | 'submit'
  context?: {
    kind?: 'course' | 'sandbox' | 'daily' | 'weekly'
    ref?: string | null
  }
}

/** Procedure outputs stay tiny literals — avoids huge `RouterOutputs` in consumers. */
type CodeImproveRegenerateOut = { jobId: string | null }
type CodeImproveStartOut = { jobId: string }
type ExecutionRunOut = { executionId: string }
type ProgressMarkCompleteOut = { completed: boolean }

export type CodeImproveRegenerateMutationInput = { taskId: string; language: 'python' | 'php' }
export type CodeImproveStartMutationInput = {
  taskId: string
  language: 'python' | 'php'
  dedupeKey: string
}

export type ProgressMarkCompleteMutationInput = { lessonId: string }

/** Narrow `utils` surface used by InCourse shell + lesson effects. */
export type InCourseShellTrpcUtils = {
  codeImprove: {
    getJob: { invalidate: (input: { jobId: string }) => Promise<unknown> }
    latestForTask: {
      invalidate: (input: { taskId: string; language: 'python' | 'php' }) => Promise<unknown>
    }
  }
}

export interface InCourseShellPlanAndAttemptResult {
  viewerTier: number
  attemptIsSuccess: boolean
  refetchAttemptStatus: () => Promise<unknown>
}

export interface InCourseShellCodeImproveTrpcResult {
  utils: InCourseShellTrpcUtils
  aiLessonUnlocked: boolean
  liveAiJob: LiveAiJobLike | undefined | null
  qLatestPy: UseQueryResult<LatestRowLike | null | undefined, unknown>
  qLatestPhp: UseQueryResult<LatestRowLike | null | undefined, unknown>
  regenerateAiMutation: UseMutationResult<
    CodeImproveRegenerateOut,
    unknown,
    CodeImproveRegenerateMutationInput
  >
  startAiMutation: UseMutationResult<CodeImproveStartOut, unknown, CodeImproveStartMutationInput>
}

export interface InCourseShellExecutionTrpcResult {
  runMutation: UseMutationResult<ExecutionRunOut, unknown, ExecutionRunMutationInput>
  completeMutation: UseMutationResult<
    ProgressMarkCompleteOut,
    unknown,
    ProgressMarkCompleteMutationInput
  >
}

export interface UseInCourseShellTrpcResult {
  viewerTier: number
  attemptIsSuccess: boolean
  utils: InCourseShellTrpcUtils
  aiLessonUnlocked: boolean
  liveAiJob: LiveAiJobLike | undefined | null
  qLatestPy: UseQueryResult<LatestRowLike | null | undefined, unknown>
  qLatestPhp: UseQueryResult<LatestRowLike | null | undefined, unknown>
  regenerateAiMutation: UseMutationResult<
    CodeImproveRegenerateOut,
    unknown,
    CodeImproveRegenerateMutationInput
  >
  startAiMutation: UseMutationResult<CodeImproveStartOut, unknown, CodeImproveStartMutationInput>
  runMutation: UseMutationResult<ExecutionRunOut, unknown, ExecutionRunMutationInput>
  completeMutation: UseMutationResult<
    ProgressMarkCompleteOut,
    unknown,
    ProgressMarkCompleteMutationInput
  >
}
