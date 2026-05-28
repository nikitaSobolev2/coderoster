import { describe, expect, it } from 'vitest'

import { executionRecordFactory } from '~/../tests/setup/fixtures/executionFactory'
import {
  mapTerminalExecutionRecordToView,
  relocateStdoutDiagnosticsToStderr
} from './executionTerminalView'

describe('relocateStdoutDiagnosticsToStderr', () => {
  it('keeps_stdout_intact_when_stderr_already_filled', () => {
    const { stdout, stderr } = relocateStdoutDiagnosticsToStderr('hello', 'already')
    expect(stdout).toBe('hello')
    expect(stderr).toBe('already')
  })

  it('moves_php_fatal_block_to_stderr', () => {
    const input = 'output line\nPHP Fatal error: boom on line 3'
    const { stdout, stderr } = relocateStdoutDiagnosticsToStderr(input, '')
    expect(stdout).toBe('output line')
    expect(stderr).toContain('PHP Fatal error')
  })

  it('moves_python_traceback_to_stderr', () => {
    const input = 'before\nTraceback (most recent call last):\n  File "<stdin>", line 1'
    const { stdout, stderr } = relocateStdoutDiagnosticsToStderr(input, '')
    expect(stdout).toBe('before')
    expect(stderr).toContain('Traceback')
  })
})

describe('mapTerminalExecutionRecordToView', () => {
  it('terminal_shows_stdout_only_when_no_errors_and_success', () => {
    const view = mapTerminalExecutionRecordToView(
      executionRecordFactory({ status: 'success', stdout: 'hi', stderr: '' })
    )
    expect(view.errorMessage).toBeNull()
    expect(view.result?.stdout).toBe('hi')
  })

  it('terminal_renders_timeout_error_when_status_timeout_with_no_stdio', () => {
    const view = mapTerminalExecutionRecordToView(
      executionRecordFactory({ status: 'timeout', stdout: '', stderr: '' })
    )
    expect(view.result).toBeNull()
    expect(view.errorMessage).toBe('Превышен лимит времени.')
  })

  it('terminal_renders_errorMessage_from_worker_when_failed_no_stdio', () => {
    const view = mapTerminalExecutionRecordToView(
      executionRecordFactory({
        status: 'failed',
        stdout: '',
        stderr: '',
        errorMessage: 'worker died'
      })
    )
    expect(view.result).toBeNull()
    expect(view.errorMessage).toBe('worker died')
  })

  it('terminal_returns_result_with_stdio_even_when_status_failed', () => {
    const view = mapTerminalExecutionRecordToView(
      executionRecordFactory({ status: 'failed', stdout: '', stderr: 'NameError' })
    )
    expect(view.result?.stderr).toBe('NameError')
  })
})
