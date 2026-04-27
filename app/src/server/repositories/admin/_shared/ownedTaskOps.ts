import 'server-only'
import { Prisma, TaskKind } from '@prisma/client'
import { db } from '~/server/db'
import { sanitizeMarkdown, sanitizePlainText } from '~/server/lib/sanitize'

/**
 * `CourseTask` is polymorphic — it belongs to exactly one of: a course module,
 * a daily challenge, or a weekly challenge. This module is the single source
 * of truth for "create / update / delete / reorder tasks under an owner" and
 * the same for autotests, so the three feature repositories share the same
 * code path (DRY) and the invariant of "exactly one owner FK is set" lives in
 * one place.
 */
export type TaskOwnerRef =
  | { kind: 'MODULE'; moduleId: string }
  | { kind: 'DAILY'; dailyChallengeId: string }
  | { kind: 'WEEKLY'; weeklyChallengeId: string }

export interface OwnedTaskCreateInput {
  title: string
  summary?: string
  description?: string
  kind?: TaskKind
  estimatedMinutes?: number
  allowedLanguages?: string[]
  initialData?: Record<string, unknown>
  result?: Record<string, unknown> | null
}

export interface OwnedTaskUpdateInput {
  title?: string
  summary?: string
  description?: string
  kind?: TaskKind
  estimatedMinutes?: number
  allowedLanguages?: string[]
  initialData?: Record<string, unknown>
  result?: Record<string, unknown> | null
}

export interface OwnedAutotestUpsertInput {
  name: string
  input?: string | null
  expected: string
  hidden?: boolean
}

export async function createOwnedTask(
  owner: TaskOwnerRef,
  input: OwnedTaskCreateInput
): Promise<string> {
  const last = await db.courseTask.findFirst({
    where: ownerWhere(owner),
    orderBy: { order: 'desc' },
    select: { order: true }
  })
  const created = await db.courseTask.create({
    data: {
      ...ownerCreateData(owner),
      title: sanitizePlainText(input.title),
      summary: sanitizePlainText(input.summary ?? ''),
      description: sanitizeMarkdown(input.description ?? ''),
      kind: input.kind ?? TaskKind.TASK,
      estimatedMinutes: input.estimatedMinutes ?? 15,
      allowedLanguages: input.allowedLanguages ?? [],
      initialData: (input.initialData ?? {}) as Prisma.InputJsonValue,
      result:
        input.result === null || input.result === undefined
          ? Prisma.JsonNull
          : (input.result as Prisma.InputJsonValue),
      order: (last?.order ?? 0) + 1
    }
  })
  return created.id
}

export async function updateOwnedTask(taskId: string, input: OwnedTaskUpdateInput): Promise<void> {
  const data: Prisma.CourseTaskUpdateInput = {}
  if (input.title !== undefined) data.title = sanitizePlainText(input.title)
  if (input.summary !== undefined) data.summary = sanitizePlainText(input.summary)
  if (input.description !== undefined) data.description = sanitizeMarkdown(input.description)
  if (input.kind !== undefined) data.kind = input.kind
  if (input.estimatedMinutes !== undefined) data.estimatedMinutes = input.estimatedMinutes
  if (input.allowedLanguages !== undefined) data.allowedLanguages = input.allowedLanguages
  if (input.initialData !== undefined) data.initialData = input.initialData as Prisma.InputJsonValue
  if (input.result !== undefined) {
    data.result = input.result === null ? Prisma.JsonNull : (input.result as Prisma.InputJsonValue)
  }
  await db.courseTask.update({ where: { id: taskId }, data })
}

export async function deleteOwnedTask(taskId: string): Promise<void> {
  await db.courseTask.delete({ where: { id: taskId } })
}

export async function reorderOwnedTasks(owner: TaskOwnerRef, orderedIds: string[]): Promise<void> {
  await db.$transaction(
    orderedIds.map((taskId, index) =>
      db.courseTask.update({
        where: { id: taskId },
        data: { ...ownerCreateData(owner), order: index + 1 }
      })
    )
  )
}

export async function createAutotest(
  taskId: string,
  input: OwnedAutotestUpsertInput
): Promise<string> {
  const last = await db.courseTaskAutotest.findFirst({
    where: { courseTaskId: taskId },
    orderBy: { order: 'desc' },
    select: { order: true }
  })
  const created = await db.courseTaskAutotest.create({
    data: {
      courseTaskId: taskId,
      name: sanitizePlainText(input.name),
      input: input.input === undefined ? null : input.input,
      expected: input.expected,
      hidden: input.hidden ?? false,
      order: (last?.order ?? -1) + 1
    }
  })
  return created.id
}

export async function updateAutotest(
  autotestId: string,
  input: Partial<OwnedAutotestUpsertInput>
): Promise<void> {
  await db.courseTaskAutotest.update({
    where: { id: autotestId },
    data: {
      name: input.name !== undefined ? sanitizePlainText(input.name) : undefined,
      input: input.input === undefined ? undefined : input.input,
      expected: input.expected,
      hidden: input.hidden
    }
  })
}

export async function deleteAutotest(autotestId: string): Promise<void> {
  await db.courseTaskAutotest.delete({ where: { id: autotestId } })
}

export async function reorderAutotests(taskId: string, orderedIds: string[]): Promise<void> {
  await db.$transaction(
    orderedIds.map((autotestId, index) =>
      db.courseTaskAutotest.update({
        where: { id: autotestId },
        data: { order: index, courseTaskId: taskId }
      })
    )
  )
}

function ownerWhere(owner: TaskOwnerRef): Prisma.CourseTaskWhereInput {
  switch (owner.kind) {
    case 'MODULE':
      return { moduleId: owner.moduleId }
    case 'DAILY':
      return { dailyChallengeId: owner.dailyChallengeId }
    case 'WEEKLY':
      return { weeklyChallengeId: owner.weeklyChallengeId }
  }
}

/**
 * Owner FK columns that go onto `CourseTask` create/update payloads. Reorder
 * uses this too — when the same task is reassigned to a different owner the
 * other two columns must be cleared so the (app-enforced) "exactly one owner"
 * invariant is preserved.
 */
function ownerCreateData(
  owner: TaskOwnerRef
): Pick<
  Prisma.CourseTaskUncheckedCreateInput,
  'moduleId' | 'dailyChallengeId' | 'weeklyChallengeId'
> {
  switch (owner.kind) {
    case 'MODULE':
      return { moduleId: owner.moduleId, dailyChallengeId: null, weeklyChallengeId: null }
    case 'DAILY':
      return { moduleId: null, dailyChallengeId: owner.dailyChallengeId, weeklyChallengeId: null }
    case 'WEEKLY':
      return { moduleId: null, dailyChallengeId: null, weeklyChallengeId: owner.weeklyChallengeId }
  }
}
