import type { Language, RunResult } from './types'
import { stubNotImplemented } from './stub'

export interface ExecutionRequest {
  taskId: string
  language: Language
  code: string
}

/**
 * Sandboxed code execution. The real implementation will enqueue jobs to
 * RabbitMQ and wait on results; the fake implementation just inspects
 * the snippet and returns canned output.
 */
export interface ExecutionRepository {
  run(request: ExecutionRequest): Promise<RunResult>
}

export class FakeExecutionRepository implements ExecutionRepository {
  async run({ language, code }: ExecutionRequest): Promise<RunResult> {
    const stdout = simulateStdout(language, code)
    const passed = stdout.length > 0 && !stdout.toLowerCase().includes('todo')
    return {
      stdout,
      stderr: '',
      runtimeMs: Math.floor(80 + Math.random() * 220),
      passed,
      testResults: [
        {
          name: 'Базовый прогон',
          passed,
          expected: 'непустой вывод',
          actual: stdout || '<пусто>',
          message: passed ? null : 'Программа не вывела ожидаемый результат'
        },
        {
          name: 'Скрытый кейс',
          passed,
          expected: null,
          actual: null,
          message: passed ? null : 'Скрытый тест провалился вместе с базовым'
        }
      ]
    }
  }
}

export class PrismaExecutionRepository implements ExecutionRepository {
  run(): Promise<RunResult> {
    return stubNotImplemented('ExecutionRepository.run')
  }
}

function simulateStdout(language: Language, code: string): string {
  const printPattern = language === 'python' ? /print\(([^)]+)\)/g : /echo\s+([^;]+);?/g
  const lines: string[] = []
  let match: RegExpExecArray | null
  while ((match = printPattern.exec(code))) {
    lines.push(stripQuotes((match[1] ?? '').trim()))
  }
  if (lines.length === 0 && code.toLowerCase().includes('hello')) {
    return 'Hello, World'
  }
  return lines.join('\n')
}

function stripQuotes(value: string): string {
  if (value.length < 2) return value
  const first = value[0]
  const last = value[value.length - 1]
  if (
    (first === '"' && last === '"') ||
    (first === "'" && last === "'") ||
    (first === '`' && last === '`')
  ) {
    return value.slice(1, -1)
  }
  return value
}
