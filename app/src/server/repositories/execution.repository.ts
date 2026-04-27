import 'server-only'
import type { Prisma } from '@prisma/client'
import { db } from '~/server/db'
import { toExecutionRecord } from './mappers'
import type {
  ExecutionContextKind,
  ExecutionMode,
  ExecutionRecord,
  Language,
  RunResult
} from './types'

export interface ExecutionEnqueueInput {
  taskId: string | null
  language: Language
  code: string
  mode: ExecutionMode
  contextKind?: ExecutionContextKind
  contextRef?: string | null
}

export interface AutotestPayload {
  name: string
  input: string | null
  expected: string
  hidden: boolean
}

export interface ExecutionRepository {
  enqueue(userId: string, input: ExecutionEnqueueInput): Promise<{ executionId: string }>
  getById(id: string, userId: string): Promise<ExecutionRecord | null>
  markRunning(id: string): Promise<void>
  markFinished(id: string, result: RunResult): Promise<void>
  markFailed(id: string, errorMessage: string): Promise<void>
}

const TOPIC = 'execution.requested'

const CONTEXT_TO_PRISMA: Record<ExecutionContextKind, 'COURSE' | 'SANDBOX' | 'DAILY' | 'WEEKLY'> = {
  course: 'COURSE',
  sandbox: 'SANDBOX',
  daily: 'DAILY',
  weekly: 'WEEKLY'
}

export class FakeExecutionRepository implements ExecutionRepository {
  private readonly executions = new Map<string, ExecutionRecord>()

  async enqueue(userId: string, input: ExecutionEnqueueInput): Promise<{ executionId: string }> {
    const id = `exec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const stdout = simulateStdout(input.language, input.code)
    const isSubmit = input.mode === 'submit'
    const passed = isSubmit && stdout.length > 0 && !stdout.toLowerCase().includes('todo')
    const now = new Date()
    this.executions.set(id, {
      id,
      status: 'success',
      language: input.language,
      taskId: input.taskId,
      mode: input.mode,
      contextKind: input.contextKind ?? 'course',
      contextRef: input.contextRef ?? null,
      stdout,
      stderr: '',
      runtimeMs: Math.floor(80 + Math.random() * 220),
      passed: isSubmit ? passed : null,
      testResults: isSubmit
        ? [
            {
              name: 'Базовый прогон',
              passed,
              expected: 'непустой вывод',
              actual: stdout || '<пусто>',
              message: passed ? null : 'Программа не вывела ожидаемый результат'
            }
          ]
        : [],
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
    const resolvedTaskId = await this.resolveTaskId(input.taskId)
    const tests = await this.collectAutotests({ ...input, taskId: resolvedTaskId })
    const execution = await db.$transaction(async tx => {
      const created = await tx.execution.create({
        data: {
          userId,
          taskId: resolvedTaskId,
          language: input.language,
          code: input.code,
          mode: input.mode === 'submit' ? 'SUBMIT' : 'RUN',
          contextKind: CONTEXT_TO_PRISMA[input.contextKind ?? 'course'],
          contextRef: input.contextRef ?? null,
          status: 'QUEUED'
        }
      })
      await tx.outboxEvent.create({
        data: {
          topic: TOPIC,
          payload: {
            executionId: created.id,
            userId,
            taskId: resolvedTaskId,
            language: input.language,
            code: input.code,
            mode: input.mode,
            tests
          } as unknown as Prisma.InputJsonValue
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

  private async collectAutotests(input: ExecutionEnqueueInput): Promise<AutotestPayload[]> {
    if (input.mode !== 'submit' || !input.taskId) return []
    const rows = await db.courseTaskAutotest.findMany({
      where: { courseTaskId: input.taskId },
      orderBy: { order: 'asc' }
    })
    return rows.map(row => ({
      name: row.name,
      input: row.input ?? null,
      expected: row.expected,
      hidden: row.hidden
    }))
  }

  /**
   * Maps a lesson identifier (cuid or legacy fixture slug stored under
   * `initialData.slug`) to the canonical Prisma id. Returns `null` when no
   * task matches so the execution row is created without a FK reference
   * (sandbox-style ad-hoc runs).
   */
  private async resolveTaskId(identifier: string | null | undefined): Promise<string | null> {
    if (!identifier) return null
    const direct = await db.courseTask.findUnique({
      where: { id: identifier },
      select: { id: true }
    })
    if (direct) return direct.id
    const bySlug = await db.courseTask.findFirst({
      where: { initialData: { path: ['slug'], equals: identifier } },
      select: { id: true }
    })
    return bySlug?.id ?? null
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
