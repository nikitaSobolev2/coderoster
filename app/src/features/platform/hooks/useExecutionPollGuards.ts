'use client'

import { useEffect } from 'react'

const STALE_MESSAGE =
  'Результат не пришёл вовремя. Проверь Docker: сервисы outbox, worker-code-exec и result-consumer должны быть запущены (см. docker-compose.yml).'

/**
 * Avoids infinite «запускаем…» when `execution.get` fails or the pipeline never
 * writes a terminal row (missing worker / broker / consumer).
 */
export function useExecutionPollGuards(options: {
  phase: 'idle' | 'running' | 'done'
  executionId: string | null
  pollFailed: boolean
  pollErrorMessage: string | undefined
  onAbort: (message: string) => void
  /** Submit runs several sandbox rounds; allow extra headroom. */
  staleAfterMs?: number
}): void {
  const {
    phase,
    executionId,
    pollFailed,
    pollErrorMessage,
    onAbort,
    staleAfterMs = 180_000
  } = options

  useEffect(() => {
    if (phase !== 'running' || !pollFailed) return
    const msg = pollErrorMessage?.trim()
    onAbort(msg && msg.length > 0 ? msg : 'Не удалось получить статус выполнения.')
  }, [phase, pollFailed, pollErrorMessage, onAbort])

  useEffect(() => {
    if (phase !== 'running' || executionId === null) return
    const timer = window.setTimeout(() => onAbort(STALE_MESSAGE), staleAfterMs)
    return () => window.clearTimeout(timer)
  }, [phase, executionId, staleAfterMs, onAbort])
}
