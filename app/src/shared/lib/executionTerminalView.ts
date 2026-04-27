import type { ExecutionRecord, RunResult } from '~/server/repositories/types'

export interface ExecutionTerminalView {
  result: RunResult | null
  errorMessage: string | null
}

/**
 * Maps a terminal {@link ExecutionRecord} to UI state. Non-`success` runs may
 * still have stdout/stderr (e.g. Python trace) or test rows — show those
 * instead of a bare status label.
 */
export function mapTerminalExecutionRecordToView(record: ExecutionRecord): ExecutionTerminalView {
  const stdout = record.stdout ?? ''
  const stderr = record.stderr ?? ''
  const hasStdio = stdout.trim() !== '' || stderr.trim() !== ''
  const testResults = record.testResults ?? []
  const hasTests = testResults.length > 0

  if (record.status === 'success') {
    return {
      result: {
        stdout,
        stderr,
        runtimeMs: record.runtimeMs ?? 0,
        passed: Boolean(record.passed),
        testResults
      },
      errorMessage: null
    }
  }

  if (hasStdio || hasTests) {
    return {
      result: {
        stdout,
        stderr,
        runtimeMs: record.runtimeMs ?? 0,
        passed: Boolean(record.passed),
        testResults
      },
      errorMessage: null
    }
  }

  const fromWorker = record.errorMessage?.trim()
  if (fromWorker) {
    return { result: null, errorMessage: fromWorker }
  }
  if (record.status === 'timeout') {
    return { result: null, errorMessage: 'Превышен лимит времени.' }
  }
  return { result: null, errorMessage: `Ошибка выполнения: ${record.status}` }
}
