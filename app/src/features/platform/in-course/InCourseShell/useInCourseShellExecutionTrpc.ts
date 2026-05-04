'use client'

import { useCallback, useEffect } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { notifications } from '@mantine/notifications'
import type { ExecutionRecord, LessonDetail, RunResult } from '~/server/repositories/types'

import { api } from '~/trpc/react'
import { mapTerminalExecutionRecordToView } from '~/shared/lib/executionTerminalView'
import { useExecutionPollGuards } from '~/features/platform/hooks/useExecutionPollGuards'

import { ignoreRejectedQueryPromise, trpcMutationMessage } from './inCourseShellTrpcHelpers'
import type { InCourseShellExecutionTrpcResult } from './inCourseShellTrpcContracts'
import type { ExecutionState } from '../ExecutionPanel'

function isTerminalExecutionRecordStatus(status: ExecutionRecord['status']): boolean {
  return status !== 'queued' && status !== 'running'
}

export function useInCourseShellExecutionTrpc(options: {
  lesson: Pick<LessonDetail, 'id'>
  executionId: string | null
  setExecutionId: Dispatch<SetStateAction<string | null>>
  executionState: ExecutionState
  setExecutionState: Dispatch<SetStateAction<ExecutionState>>
  setExecutionError: Dispatch<SetStateAction<string | null>>
  setExecutionResult: Dispatch<SetStateAction<RunResult | null>>
  setCompletedLessonIds: Dispatch<SetStateAction<string[]>>
  refetchAttemptStatus: () => Promise<unknown>
}) {
  const {
    lesson,
    executionId,
    setExecutionId,
    executionState,
    setExecutionState,
    setExecutionError,
    setExecutionResult,
    setCompletedLessonIds,
    refetchAttemptStatus
  } = options

  const abortExecutionPoll = useCallback(
    (message: string) => {
      setExecutionError(message)
      setExecutionState('done')
    },
    [setExecutionError, setExecutionState]
  )

  const applyExecutionRecord = useCallback(
    (record: ExecutionRecord) => {
      const { result, errorMessage } = mapTerminalExecutionRecordToView(record)
      setExecutionResult(result)
      setExecutionError(errorMessage)
      setExecutionState('done')
      if (result && record.mode === 'submit' && result.passed) {
        ignoreRejectedQueryPromise(refetchAttemptStatus())
      }
      if (result && record.mode === 'submit') {
        if (result.passed) {
          notifications.show({
            color: 'green',
            message: 'Все тесты пройдены — задача зачтена.'
          })
        } else {
          notifications.show({
            color: 'orange',
            message: 'Часть тестов провалена. Попробуй ещё раз.'
          })
        }
      }
    },
    [refetchAttemptStatus, setExecutionResult, setExecutionError, setExecutionState]
  )

  const runMutation = api.execution.run.useMutation({
    onMutate: () => {
      setExecutionState('running')
      setExecutionError(null)
      setExecutionResult(null)
      setExecutionId(null)
    },
    onSuccess: data => setExecutionId(data.executionId),
    onError: error => {
      setExecutionError(trpcMutationMessage(error))
      setExecutionState('done')
    }
  })

  const pollQuery = api.execution.get.useQuery(
    { executionId: executionId ?? '' },
    {
      enabled: executionId !== null,
      refetchInterval: query => {
        const record = query.state.data
        return record && isTerminalExecutionRecordStatus(record.status) ? false : 750
      },
      refetchOnWindowFocus: false,
      retry: 1,
      retryDelay: 400
    }
  )

  useExecutionPollGuards({
    phase: executionState,
    executionId,
    pollFailed: pollQuery.isError,
    pollErrorMessage: pollQuery.error?.message,
    onAbort: abortExecutionPoll,
    staleAfterMs: 180_000
  })

  useEffect(() => {
    const record = pollQuery.data
    if (!record || !isTerminalExecutionRecordStatus(record.status)) return
    applyExecutionRecord(record)
  }, [pollQuery.data, applyExecutionRecord])

  const completeMutation = api.progress.markComplete.useMutation({
    onSuccess: () => {
      setCompletedLessonIds(ids => (ids.includes(lesson.id) ? ids : [...ids, lesson.id]))
      ignoreRejectedQueryPromise(refetchAttemptStatus())
      notifications.show({ color: 'green', message: 'Урок отмечен пройденным.' })
    }
  })

  const result: InCourseShellExecutionTrpcResult = {
    runMutation,
    completeMutation
  }

  return result
}
