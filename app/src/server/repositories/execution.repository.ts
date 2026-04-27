import 'server-only'
import type { Prisma } from '@prisma/client'
import { db } from '~/server/db'
import { toExecutionRecord } from './mappers'
import type { ExecutionRecord, Language, RunResult } from './types'

export interface ExecutionEnqueueInput {
  taskId: string
  language: Language
  code: string
}

export interface ExecutionRepository {
  enqueue(userId: string, input: ExecutionEnqueueInput): Promise<{ executionId: string }>
  getById(id: string, userId: string): Promise<ExecutionRecord | null>
  markRunning(id: string): Promise<void>
  markFinished(id: string, result: RunResult): Promise<void>
  markFailed(id: string, errorMessage: string): Promise<void>
}

const TOPIC = 'execution.requested'

export class FakeExecutionRepository implements ExecutionRepository {
  private readonly executions = new Map<string, ExecutionRecord>()

  async enqueue(userId: string, input: ExecutionEnqueueInput): Promise<{ executionId: string }> {
    const id = `exec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const stdout = simulateStdout(input.language, input.code)
    const passed = stdout.length > 0 && !stdout.toLowerCase().includes('todo')
    const now = new Date()
    this.executions.set(id, {
      id,
      status: 'success',
      language: input.language,
      taskId: input.taskId,
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
        }
      ],
      errorMessage: null,
      enqueuedAt: now,
      startedAt: now,
      finishedAt: now
    })
    void userId
    return { executionId: id }
  }

  async getById(id: string, _userId: string): Promise<ExecutionRecord | null> {
    return this.executions.get(id) ?? null
  }

  async markRunning(): Promise<void> {
    /* fake executions complete instantly inside enqueue */
  }
  async markFinished(): Promise<void> {
    /* fake executions complete instantly inside enqueue */
  }
  async markFailed(): Promise<void> {
    /* fake executions complete instantly inside enqueue */
  }
}

export class PrismaExecutionRepository implements ExecutionRepository {
  async enqueue(userId: string, input: ExecutionEnqueueInput): Promise<{ executionId: string }> {
    const execution = await db.$transaction(async tx => {
      const created = await tx.execution.create({
        data: {
          userId,
          taskId: input.taskId,
          language: input.language,
          code: input.code,
          status: 'QUEUED'
        }
      })
      await tx.outboxEvent.create({
        data: {
          topic: TOPIC,
          payload: {
            executionId: created.id,
            userId,
            taskId: input.taskId,
            language: input.language,
            code: input.code
          } satisfies Prisma.InputJsonValue
        }
      })
      return created
    })
    return { executionId: execution.id }
  }

  async getById(id: string, userId: string): Promise<ExecutionRecord | null> {
    const execution = await db.execution.findFirst({ where: { id, userId } })
    if (!execution) return null
    return toExecutionRecord(execution)
  }

  async markRunning(id: string): Promise<void> {
    await db.execution.update({
      where: { id },
      data: { status: 'RUNNING', startedAt: new Date() }
    })
  }

  async markFinished(id: string, result: RunResult): Promise<void> {
    await db.execution.update({
      where: { id },
      data: {
        status: 'SUCCESS',
        finishedAt: new Date(),
        stdout: result.stdout,
        stderr: result.stderr,
        runtimeMs: result.runtimeMs,
        passed: result.passed,
        testResults: result.testResults as unknown as Prisma.InputJsonValue
      }
    })
  }

  async markFailed(id: string, errorMessage: string): Promise<void> {
    await db.execution.update({
      where: { id },
      data: {
        status: 'FAILED',
        finishedAt: new Date(),
        errorMessage
      }
    })
  }
}

function simulateStdout(language: Language, code: string): string {
  const printPattern = language === 'python' ? /print\(([^)]+)\)/g : /echo\s+([^;]+);?/g
  const lines: string[] = []
  let match: RegExpExecArray | null
  while ((match = printPattern.exec(code))) {
    const captured = match[1]?.trim() ?? ''
    lines.push(stripQuotes(captured))
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
