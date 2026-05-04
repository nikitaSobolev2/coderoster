'use client'

import { mergeInCourseShellTrpcSlices } from './mergeInCourseShellTrpcSlices'
import type { UseInCourseShellTrpcResult } from './inCourseShellTrpcContracts'
import type { UseInCourseShellTrpcParams } from './useInCourseShellTrpc'
import { useInCourseShellCodeImproveTrpc } from './useInCourseShellCodeImproveTrpc'
import { useInCourseShellExecutionTrpc } from './useInCourseShellExecutionTrpc'
import { useInCourseShellPlanAndAttempt } from './useInCourseShellPlanAndAttempt'

/**
 * Single composition entry — keeps TRPC inference off `index.tsx`, where ESLint's checker loses types on large client components.
 */
export function useInCourseShellTrpcBundle(
  p: Readonly<UseInCourseShellTrpcParams>
): UseInCourseShellTrpcResult {
  const planAttempt = useInCourseShellPlanAndAttempt(p.lesson)
  const improve = useInCourseShellCodeImproveTrpc({
    lesson: p.lesson,
    viewerIsAdmin: p.viewerIsAdmin,
    viewerTier: planAttempt.viewerTier,
    attemptIsSuccess: planAttempt.attemptIsSuccess,
    aiJobId: p.aiJobId,
    setAiJobId: p.setAiJobId,
    setSolutionVariant: p.setSolutionVariant,
    setLeftPaneTab: p.setLeftPaneTab
  })
  const exec = useInCourseShellExecutionTrpc({
    lesson: p.lesson,
    executionId: p.executionId,
    setExecutionId: p.setExecutionId,
    executionState: p.executionState,
    setExecutionState: p.setExecutionState,
    setExecutionError: p.setExecutionError,
    setExecutionResult: p.setExecutionResult,
    setCompletedLessonIds: p.setCompletedLessonIds,
    refetchAttemptStatus: planAttempt.refetchAttemptStatus
  })
  return mergeInCourseShellTrpcSlices(planAttempt, improve, exec)
}
