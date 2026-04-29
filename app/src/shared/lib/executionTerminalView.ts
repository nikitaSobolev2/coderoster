import type { ExecutionRecord, RunResult } from '~/server/repositories/types'

export interface ExecutionTerminalView {
  result: RunResult | null
  errorMessage: string | null
}

/**
 * PHP (and occasionally other CLIs writing to stdin) may emit diagnostics on
 * stdout while stderr stays empty — UI then renders them as normal Output.
 * Moves the first diagnostic line and everything after to stderr when stderr
 * is empty so Вывод stays clean and Ошибки + styling apply consistently.
 */
export function relocateStdoutDiagnosticsToStderr(
  stdout: string,
  stderr: string
): { stdout: string; stderr: string } {
  if (stderr.trim() !== '') {
    return { stdout, stderr }
  }
  const lines = stdout.replaceAll('\r\n', '\n').replaceAll('\r', '\n').split('\n')
  const diagAt = lines.findIndex(line => {
    const t = line.trimStart()
    return /^((PHP\s+)?Parse error:|(?:PHP\s+)?Fatal error|Fatal error\b|PHP Fatal error|^Parse error|Traceback \(most recent call last\))/i.test(
      t
    )
  })
  if (diagAt === -1) {
    return { stdout, stderr }
  }
  const kept = lines.slice(0, diagAt).join('\n').trimEnd()
  const moved = lines.slice(diagAt).join('\n').trimEnd()
  return {
    stdout: kept,
    stderr: moved
  }
}

/**
 * Maps a terminal {@link ExecutionRecord} to UI state. Non-`success` runs may
 * still have stdout/stderr (e.g. Python trace) or test rows — show those
 * instead of a bare status label.
 */
export function mapTerminalExecutionRecordToView(record: ExecutionRecord): ExecutionTerminalView {
  let stdout = record.stdout ?? ''
  let stderr = record.stderr ?? ''
  ;({ stdout, stderr } = relocateStdoutDiagnosticsToStderr(stdout, stderr))

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
