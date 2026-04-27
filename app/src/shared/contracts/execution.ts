import { z } from 'zod'

/**
 * Wire contract between the Next.js app and the Go code-executor worker.
 * The Go side mirrors these shapes manually in
 * `workers/code-executor/internal/contracts/events.go`. Any change here MUST
 * be paired with the Go counterpart until codegen lands.
 */

export const EXECUTION_REQUESTED_TOPIC = 'execution.requested'
export const EXECUTION_COMPLETED_TOPIC = 'execution.completed'

export const executionTestSpecSchema = z.object({
  name: z.string().min(1),
  input: z.string().nullable(),
  expected: z.string(),
  hidden: z.boolean().default(false)
})

export type ExecutionTestSpec = z.infer<typeof executionTestSpecSchema>

export const executionRequestedSchema = z.object({
  executionId: z.string().min(1),
  userId: z.string().min(1),
  taskId: z.string().nullable(),
  language: z.enum(['python', 'php']),
  code: z.string().max(50_000),
  mode: z.enum(['run', 'submit']).default('run'),
  tests: z.array(executionTestSpecSchema).default([])
})

export type ExecutionRequested = z.infer<typeof executionRequestedSchema>

export const executionTestResultSchema = z.object({
  name: z.string(),
  passed: z.boolean(),
  expected: z.string().nullable(),
  actual: z.string().nullable(),
  message: z.string().nullable(),
  hidden: z.boolean().optional().default(false),
  input: z.string().nullable().optional()
})

export const executionCompletedSchema = z.object({
  executionId: z.string().min(1),
  status: z.enum(['success', 'failed', 'timeout', 'cancelled']),
  mode: z.enum(['run', 'submit']).default('run'),
  stdout: z.string(),
  stderr: z.string(),
  runtimeMs: z.number().int().nonnegative(),
  passed: z.boolean(),
  testResults: z.array(executionTestResultSchema),
  errorMessage: z.string().nullable()
})

export type ExecutionCompleted = z.infer<typeof executionCompletedSchema>
