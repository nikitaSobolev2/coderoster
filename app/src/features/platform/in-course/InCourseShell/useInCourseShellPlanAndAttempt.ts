'use client'

import type { LessonDetail } from '~/server/repositories/types'

import { api } from '~/trpc/react'

import type { InCourseShellPlanAndAttemptResult } from './inCourseShellTrpcContracts'

export function useInCourseShellPlanAndAttempt(
  lesson: Pick<LessonDetail, 'id' | 'kind'>
): InCourseShellPlanAndAttemptResult {
  const planQuery = api.plan.getMine.useQuery(undefined, { staleTime: 60_000 })
  const viewerTier = planQuery.data?.tierLevel ?? 0

  const attemptQuery = api.progress.getTaskAttemptStatus.useQuery(
    { lessonId: lesson.id },
    { enabled: lesson.kind === 'task', staleTime: 15_000 }
  )
  const attemptIsSuccess = attemptQuery.data === 'SUCCESS'
  const refetchAttemptStatus = attemptQuery.refetch

  const result: InCourseShellPlanAndAttemptResult = {
    viewerTier,
    attemptIsSuccess,
    refetchAttemptStatus
  }

  return result
}
