import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/server/db', () => ({ db: {} }))
vi.mock('~/server/services/PlanService', () => ({
  planService: { canAccessTask: vi.fn(async () => true) }
}))

import { FakeExecutionRepository } from './execution.repository'

describe('FakeExecutionRepository', () => {
  let repo: FakeExecutionRepository
  const userId = faker.string.uuid()

  beforeEach(() => {
    repo = new FakeExecutionRepository()
  })

  it('enqueue_returns_executionId_with_exec_prefix', async () => {
    const { executionId } = await repo.enqueue(userId, {
      taskId: null,
      language: 'python',
      code: 'print(1)',
      mode: 'run'
    })
    expect(executionId).toMatch(/^exec_/)
  })

  it('enqueue_simulates_stdout_from_print_call', async () => {
    const { executionId } = await repo.enqueue(userId, {
      taskId: null,
      language: 'python',
      code: 'print("hi")',
      mode: 'run'
    })
    const record = await repo.getById(executionId, userId)
    expect(record?.stdout).toBe('hi')
  })

  it('enqueue_simulates_stdout_for_php_echo', async () => {
    const { executionId } = await repo.enqueue(userId, {
      taskId: null,
      language: 'php',
      code: '<?php echo "x";',
      mode: 'run'
    })
    const record = await repo.getById(executionId, userId)
    expect(record?.stdout).toBe('x')
  })

  it('enqueue_returns_hello_world_when_code_contains_hello', async () => {
    const { executionId } = await repo.enqueue(userId, {
      taskId: null,
      language: 'python',
      code: '# Hello there',
      mode: 'run'
    })
    const record = await repo.getById(executionId, userId)
    expect(record?.stdout).toContain('Hello')
  })

  it('submit_mode_marks_passed_when_stdout_non_empty', async () => {
    const { executionId } = await repo.enqueue(userId, {
      taskId: faker.string.uuid(),
      language: 'python',
      code: 'print("ok")',
      mode: 'submit'
    })
    const record = await repo.getById(executionId, userId)
    expect(record?.passed).toBe(true)
  })

  it('submit_mode_marks_passed_false_when_code_contains_TODO', async () => {
    const { executionId } = await repo.enqueue(userId, {
      taskId: faker.string.uuid(),
      language: 'python',
      code: '# TODO: write me later',
      mode: 'submit'
    })
    const record = await repo.getById(executionId, userId)
    expect(record?.passed).toBe(false)
  })

  it('getById_returns_null_for_unknown_id', async () => {
    expect(await repo.getById('exec_missing', userId)).toBeNull()
  })

  it('markRunning_markFinished_markFailed_resolve_in_fake_mode', async () => {
    await expect(repo.markRunning('any')).resolves.toBeUndefined()
    await expect(
      repo.markFinished('any', {
        stdout: '',
        stderr: '',
        runtimeMs: 0,
        passed: false,
        testResults: []
      })
    ).resolves.toBeUndefined()
    await expect(repo.markFailed('any', 'msg')).resolves.toBeUndefined()
  })
})
