import { CourseStatus } from '@prisma/client'
import { prisma } from '../lib/client'
import type { CourseDef } from './courseTypes'
import type { CoursePrimaryLanguage } from './courseTypes'
import { COURSE_DEFS } from './courseDefinitions'
import { upsertModuleTask } from './taskFactory'
import type { CatalogLeafMap } from './categories'

export interface SeedCourseMeta {
  slug: string
  id: string
  taskIdsInOrder: string[]
}

export async function seedAllCoursesFromDefs(
  defs: CourseDef[],
  authors: { primary: string; secondary: string; algo: string },
  leafMap: CatalogLeafMap
): Promise<{ courses: SeedCourseMeta[]; taskSlugToId: Map<string, string> }> {
  const taskSlugToId = new Map<string, string>()
  const courses: SeedCourseMeta[] = []

  for (const def of defs) {
    const authorId =
      def.author === 'primary'
        ? authors.primary
        : def.author === 'secondary'
          ? authors.secondary
          : authors.algo
    const categoryId = leafMap[def.categoryLeafSlug]
    if (!categoryId) {
      throw new Error(`[seed] missing category leaf: ${def.categoryLeafSlug}`)
    }

    const primaryLanguage: CoursePrimaryLanguage = def.primaryLanguage ?? 'python'
    const tierRequired = def.tierRequired ?? 0

    const existing = await prisma.course.findUnique({ where: { slug: def.slug } })
    if (existing) {
      await prisma.course.delete({ where: { id: existing.id } })
    }

    const course = await prisma.course.create({
      data: {
        slug: def.slug,
        title: def.title,
        summary: def.summary,
        shortSummary: def.shortSummary,
        description: def.description,
        language: primaryLanguage,
        difficulty: def.difficulty,
        durationHours: def.durationHours,
        xpReward: def.xpReward,
        tags: def.tags,
        status: CourseStatus.PUBLISHED,
        publishedAt: new Date(),
        authorId,
        categoryId,
        tierRequired,
        coverImage: def.coverImage ?? undefined
      }
    })

    const taskIdsInOrder: string[] = []
    for (let mi = 0; mi < def.modules.length; mi++) {
      const mod = def.modules[mi]!
      const courseModule = await prisma.courseModule.create({
        data: {
          courseId: course.id,
          title: mod.title,
          description: mod.description,
          order: mi + 1
        }
      })
      for (let li = 0; li < mod.lessons.length; li++) {
        const les = mod.lessons[li]!
        const task = await upsertModuleTask(courseModule.id, li + 1, les, primaryLanguage)
        taskIdsInOrder.push(task.id)
        taskSlugToId.set(les.slug, task.id)
      }
    }
    courses.push({ slug: course.slug, id: course.id, taskIdsInOrder })
  }

  return { courses, taskSlugToId }
}

export async function seedAllCourses(
  authors: { primary: string; secondary: string; algo: string },
  leafMap: CatalogLeafMap
): Promise<{ courses: SeedCourseMeta[]; taskSlugToId: Map<string, string> }> {
  return seedAllCoursesFromDefs(COURSE_DEFS, authors, leafMap)
}
