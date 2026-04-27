import 'server-only'
import { Prisma, TaskKind } from '@prisma/client'
import { db } from '~/server/db'
import { sanitizeMarkdown, sanitizePlainText } from '~/server/lib/sanitize'
import {
  createAutotest as createAutotestHelper,
  createOwnedTask,
  deleteAutotest as deleteAutotestHelper,
  deleteOwnedTask,
  reorderAutotests as reorderAutotestsHelper,
  reorderOwnedTasks,
  updateAutotest as updateAutotestHelper,
  updateOwnedTask,
  type OwnedAutotestUpsertInput,
  type OwnedTaskCreateInput,
  type OwnedTaskUpdateInput
} from './_shared/ownedTaskOps'

export interface AdminCourseTreeAutotest {
  id: string
  order: number
  name: string
  input: string | null
  expected: string
  hidden: boolean
}

export interface AdminCourseTreeTask {
  id: string
  moduleId: string | null
  order: number
  title: string
  summary: string
  description: string
  kind: TaskKind
  estimatedMinutes: number
  allowedLanguages: string[]
  initialData: Record<string, unknown>
  result: Record<string, unknown> | null
  autotests: AdminCourseTreeAutotest[]
}

export interface AdminCourseTreeModule {
  id: string
  order: number
  title: string
  description: string
  tasks: AdminCourseTreeTask[]
}

export interface AdminCourseTree {
  id: string
  slug: string
  title: string
  summary: string
  shortSummary: string
  description: string
  language: string
  difficulty: string
  status: string
  durationHours: number
  xpReward: number
  tags: string[]
  coverImage: string | null
  categoryId: string | null
  authorId: string
  publishedAt: Date | null
  modules: AdminCourseTreeModule[]
}

export interface AdminCourseUpdateInput {
  slug?: string
  title?: string
  summary?: string
  shortSummary?: string
  description?: string
  language?: string
  difficulty?: string
  durationHours?: number
  xpReward?: number
  coverImage?: string | null
  categoryId?: string | null
  tags?: string[]
}

export interface AdminModuleUpsertInput {
  title: string
  description?: string
}

export type AdminTaskCreateInput = OwnedTaskCreateInput
export type AdminTaskUpdateInput = OwnedTaskUpdateInput
export type AdminAutotestUpsertInput = OwnedAutotestUpsertInput

export class AdminCourseEditorRepository {
  async getTree(courseId: string): Promise<AdminCourseTree> {
    const course = await db.course.findUniqueOrThrow({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { order: 'asc' },
              include: { autotests: { orderBy: { order: 'asc' } } }
            }
          }
        }
      }
    })
    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      summary: course.summary,
      shortSummary: course.shortSummary,
      description: course.description,
      language: course.language,
      difficulty: course.difficulty,
      status: course.status,
      durationHours: course.durationHours,
      xpReward: course.xpReward,
      tags: course.tags,
      coverImage: course.coverImage,
      categoryId: course.categoryId,
      authorId: course.authorId,
      publishedAt: course.publishedAt,
      modules: course.modules.map(module => ({
        id: module.id,
        order: module.order,
        title: module.title,
        description: module.description,
        tasks: module.tasks.map(task => ({
          id: task.id,
          moduleId: task.moduleId,
          order: task.order,
          title: task.title,
          summary: task.summary,
          description: task.description,
          kind: task.kind,
          estimatedMinutes: task.estimatedMinutes,
          allowedLanguages: task.allowedLanguages,
          initialData: (task.initialData ?? {}) as Record<string, unknown>,
          result: (task.result ?? null) as Record<string, unknown> | null,
          autotests: task.autotests.map(autotest => ({
            id: autotest.id,
            order: autotest.order,
            name: autotest.name,
            input: autotest.input,
            expected: autotest.expected,
            hidden: autotest.hidden
          }))
        }))
      }))
    }
  }

  async updateCourse(courseId: string, input: AdminCourseUpdateInput): Promise<void> {
    const data: Prisma.CourseUpdateInput = {}
    if (input.slug !== undefined) data.slug = input.slug
    if (input.title !== undefined) data.title = sanitizePlainText(input.title)
    if (input.summary !== undefined) data.summary = sanitizePlainText(input.summary)
    if (input.shortSummary !== undefined) data.shortSummary = sanitizePlainText(input.shortSummary)
    if (input.description !== undefined) data.description = sanitizeMarkdown(input.description)
    if (input.language !== undefined) data.language = input.language
    if (input.difficulty !== undefined) data.difficulty = input.difficulty
    if (input.durationHours !== undefined) data.durationHours = input.durationHours
    if (input.xpReward !== undefined) data.xpReward = input.xpReward
    if (input.coverImage !== undefined) data.coverImage = input.coverImage
    if (input.categoryId !== undefined) {
      data.category = input.categoryId
        ? { connect: { id: input.categoryId } }
        : { disconnect: true }
    }
    if (input.tags !== undefined) data.tags = input.tags
    await db.course.update({ where: { id: courseId }, data })
  }

  async createModule(courseId: string, input: AdminModuleUpsertInput): Promise<string> {
    const last = await db.courseModule.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' },
      select: { order: true }
    })
    const created = await db.courseModule.create({
      data: {
        courseId,
        title: sanitizePlainText(input.title),
        description: sanitizePlainText(input.description ?? ''),
        order: (last?.order ?? 0) + 1
      }
    })
    return created.id
  }

  async updateModule(moduleId: string, input: Partial<AdminModuleUpsertInput>): Promise<void> {
    await db.courseModule.update({
      where: { id: moduleId },
      data: {
        title: input.title !== undefined ? sanitizePlainText(input.title) : undefined,
        description:
          input.description !== undefined ? sanitizePlainText(input.description) : undefined
      }
    })
  }

  async deleteModule(moduleId: string): Promise<void> {
    await db.courseModule.delete({ where: { id: moduleId } })
  }

  async reorderModules(courseId: string, orderedIds: string[]): Promise<void> {
    await db.$transaction(
      orderedIds.map((moduleId, index) =>
        db.courseModule.update({
          where: { id: moduleId },
          data: { order: index + 1, courseId }
        })
      )
    )
  }

  createTask(moduleId: string, input: AdminTaskCreateInput): Promise<string> {
    return createOwnedTask({ kind: 'MODULE', moduleId }, input)
  }

  updateTask(taskId: string, input: AdminTaskUpdateInput): Promise<void> {
    return updateOwnedTask(taskId, input)
  }

  deleteTask(taskId: string): Promise<void> {
    return deleteOwnedTask(taskId)
  }

  reorderTasks(moduleId: string, orderedIds: string[]): Promise<void> {
    return reorderOwnedTasks({ kind: 'MODULE', moduleId }, orderedIds)
  }

  createAutotest(taskId: string, input: AdminAutotestUpsertInput): Promise<string> {
    return createAutotestHelper(taskId, input)
  }

  updateAutotest(autotestId: string, input: Partial<AdminAutotestUpsertInput>): Promise<void> {
    return updateAutotestHelper(autotestId, input)
  }

  deleteAutotest(autotestId: string): Promise<void> {
    return deleteAutotestHelper(autotestId)
  }

  reorderAutotests(taskId: string, orderedIds: string[]): Promise<void> {
    return reorderAutotestsHelper(taskId, orderedIds)
  }
}
