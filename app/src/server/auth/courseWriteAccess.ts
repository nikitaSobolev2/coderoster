import 'server-only'

import { TRPCError } from '@trpc/server'

import { db } from '~/server/db'
import type { AuthenticatedUser } from '~/server/repositories/types'

function isAdminRole(user: AuthenticatedUser): boolean {
  return user.role === 'admin'
}

/**
 * True when the user may mutate catalog rows for this course (ADMIN or course author).
 */
export async function assertCourseWritable(
  user: AuthenticatedUser,
  courseId: string
): Promise<void> {
  if (isAdminRole(user)) return
  if (user.role !== 'author') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Нет доступа к курсу.' })
  }
  const row = await db.course.findUnique({
    where: { id: courseId },
    select: { authorId: true }
  })
  if (row?.authorId !== user.id) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Можно редактировать только свои курсы.'
    })
  }
}

export async function assertAuthorOwnsAllCourses(
  authorUserId: string,
  courseIds: string[]
): Promise<void> {
  if (courseIds.length === 0) return
  const count = await db.course.count({
    where: { id: { in: courseIds }, authorId: authorUserId }
  })
  if (count !== courseIds.length) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Список курсов содержит элементы без прав на изменение.'
    })
  }
}

export async function assertModuleWritable(
  user: AuthenticatedUser,
  moduleId: string
): Promise<void> {
  const mod = await db.courseModule.findUnique({
    where: { id: moduleId },
    select: { courseId: true }
  })
  if (!mod) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Модуль не найден.' })
  }
  await assertCourseWritable(user, mod.courseId)
}

export async function assertCourseModuleTaskWritable(
  user: AuthenticatedUser,
  taskId: string
): Promise<void> {
  const task = await db.courseTask.findFirst({
    where: { id: taskId, moduleId: { not: null } },
    select: { moduleId: true }
  })
  if (!task?.moduleId) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Задача не найдена.' })
  }
  await assertModuleWritable(user, task.moduleId)
}
