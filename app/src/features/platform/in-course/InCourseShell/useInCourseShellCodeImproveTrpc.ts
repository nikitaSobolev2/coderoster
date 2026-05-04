'use client'

import type { Dispatch, SetStateAction } from 'react'
import { notifications } from '@mantine/notifications'
import type { LessonDetail } from '~/server/repositories/types'

import { api } from '~/trpc/react'

import { ignoreRejectedQueryPromise, trpcMutationMessage } from './inCourseShellTrpcHelpers'
import type { InCourseShellCodeImproveTrpcResult } from './inCourseShellTrpcContracts'
import type { SolutionVariantGate } from './inCourseShellSolutionVariant'
import type { TaskPaneTab } from '../TaskPane'

export function useInCourseShellCodeImproveTrpc(options: {
  lesson: LessonDetail
  viewerIsAdmin: boolean
  viewerTier: number
  attemptIsSuccess: boolean
  aiJobId: string | null
  setAiJobId: Dispatch<SetStateAction<string | null>>
  setSolutionVariant: Dispatch<SetStateAction<SolutionVariantGate>>
  setLeftPaneTab: Dispatch<SetStateAction<TaskPaneTab>>
}) {
  const {
    lesson,
    viewerIsAdmin,
    viewerTier,
    attemptIsSuccess,
    aiJobId,
    setAiJobId,
    setSolutionVariant,
    setLeftPaneTab
  } = options

  const utils = api.useUtils()

  const canUseEditor = lesson.userCanAccess
  const aiLessonUnlocked =
    lesson.kind === 'task' && attemptIsSuccess && canUseEditor && (viewerTier > 0 || viewerIsAdmin)

  const aiJobQuery = api.codeImprove.getJob.useQuery(
    { jobId: aiJobId ?? '' },
    {
      enabled: Boolean(aiJobId),
      refetchInterval: q => {
        const row = q.state.data
        if (!row) return 800
        if (row.status === 'DONE' || row.status === 'FAILED') return false
        return 800
      }
    }
  )

  const liveAiJob = aiJobQuery.data

  const qLatestPy = api.codeImprove.latestForTask.useQuery(
    { taskId: lesson.id, language: 'python' },
    {
      enabled: aiLessonUnlocked && lesson.allowedLanguages.includes('python'),
      staleTime: 30_000
    }
  )
  const qLatestPhp = api.codeImprove.latestForTask.useQuery(
    { taskId: lesson.id, language: 'php' },
    {
      enabled: aiLessonUnlocked && lesson.allowedLanguages.includes('php'),
      staleTime: 30_000
    }
  )

  const regenerateAiMutation = api.codeImprove.regenerateLatest.useMutation({
    onSuccess: (data, { language }) => {
      if (data.jobId) {
        setAiJobId(data.jobId)
        setSolutionVariant('improved')
        setLeftPaneTab('assignment')
        ignoreRejectedQueryPromise(utils.codeImprove.getJob.invalidate({ jobId: data.jobId }))
        ignoreRejectedQueryPromise(
          utils.codeImprove.latestForTask.invalidate({ taskId: lesson.id, language })
        )
      } else {
        notifications.show({
          color: 'orange',
          title: 'ИИ-разбор',
          message: 'Нет завершённого разбора для этого языка — сначала запусти «Улучши код».'
        })
      }
    },
    onError: error => {
      notifications.show({
        color: 'red',
        title: 'Перегенерация',
        message: trpcMutationMessage(error)
      })
    }
  })

  const startAiMutation = api.codeImprove.start.useMutation({
    onSuccess: data => {
      setAiJobId(data.jobId)
      setSolutionVariant('improved')
      setLeftPaneTab('assignment')
      ignoreRejectedQueryPromise(utils.codeImprove.getJob.invalidate({ jobId: data.jobId }))
    },
    onError: error => {
      notifications.show({
        color: 'red',
        title: 'ИИ-разбор',
        message: trpcMutationMessage(error)
      })
    }
  })

  const result: InCourseShellCodeImproveTrpcResult = {
    utils,
    aiLessonUnlocked,
    liveAiJob,
    qLatestPy,
    qLatestPhp,
    regenerateAiMutation,
    startAiMutation
  }

  return result
}
