import { faker } from '@faker-js/faker'
import type {
  ExecutionContextKind,
  ExecutionMode,
  ExecutionRecord,
  ExecutionStatus,
  Language,
  TestResult
} from '~/server/repositories/types'

export function testResultFactory(overrides: Partial<TestResult> = {}): TestResult {
  return {
    name: overrides.name ?? faker.lorem.words(2),
    passed: overrides.passed ?? true,
    expected: overrides.expected ?? null,
    actual: overrides.actual ?? null,
    message: overrides.message ?? null,
    hidden: overrides.hidden ?? false,
    input: overrides.input ?? null
  }
}

export function executionRecordFactory(overrides: Partial<ExecutionRecord> = {}): ExecutionRecord {
  const language: Language = overrides.language ?? 'python'
  const mode: ExecutionMode = overrides.mode ?? 'run'
  const status: ExecutionStatus = overrides.status ?? 'success'
  const contextKind: ExecutionContextKind = overrides.contextKind ?? 'course'
  return {
    id: overrides.id ?? `exec_${faker.string.alphanumeric(8)}`,
    status,
    language,
    taskId: overrides.taskId ?? null,
    mode,
    contextKind,
    contextRef: overrides.contextRef ?? null,
    stdout: overrides.stdout ?? '',
    stderr: overrides.stderr ?? '',
    runtimeMs: overrides.runtimeMs ?? faker.number.int({ min: 10, max: 500 }),
    passed: overrides.passed ?? null,
    testResults: overrides.testResults ?? [],
    errorMessage: overrides.errorMessage ?? null,
    enqueuedAt: overrides.enqueuedAt ?? new Date(),
    startedAt: overrides.startedAt ?? new Date(),
    finishedAt: overrides.finishedAt ?? new Date()
  }
}
